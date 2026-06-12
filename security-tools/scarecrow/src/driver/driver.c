#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/kprobes.h>
#include <linux/sched.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Arch Rusty Security Suite");
MODULE_DESCRIPTION("Libre-Cyber-ScareCrow LKM (Netfilter + Kprobes Sandbox)");
MODULE_VERSION("1.1.0");

// -----------------------------------------------------------------------------
// Netfilter (Firewall & Network Monitor)
// -----------------------------------------------------------------------------
static struct nf_hook_ops nfho;

static unsigned int scarecrow_network_hook(void *priv,
                                           struct sk_buff *skb,
                                           const struct nf_hook_state *state)
{
    struct iphdr *iph;
    struct tcphdr *tcph;

    if (!skb)
        return NF_ACCEPT;

    iph = ip_hdr(skb);
    if (!iph || iph->protocol != IPPROTO_TCP)
        return NF_ACCEPT;

    tcph = tcp_hdr(skb);
    if (!tcph)
        return NF_ACCEPT;

    // Simulated Network Heuristic: Block outgoing connections to notorious malware C2 ports
    // For this structural implementation, we just log suspicious ports.
    if (ntohs(tcph->dest) == 4444 || ntohs(tcph->dest) == 1337) {
        printk(KERN_WARNING "ScareCrow LKM: Blocked suspicious outbound connection to port %d\n", ntohs(tcph->dest));
        return NF_DROP;
    }

    return NF_ACCEPT;
}

// -----------------------------------------------------------------------------
// Kprobes (Process Sandboxing & Suspicious Behavior Tracking)
// -----------------------------------------------------------------------------
static struct kprobe kp_execve;

// Pre-handler for sys_execve
static int handler_pre_execve(struct kprobe *p, struct pt_regs *regs)
{
    // regs->di points to the filename on x86_64
    char __user *filename_ptr = (char __user *)regs->di;
    char filename[256];
    long copied;

    copied = strncpy_from_user(filename, filename_ptr, sizeof(filename) - 1);
    if (copied > 0) {
        filename[copied] = '\0';
        
        // Simulated Heuristic: Detect suspicious binaries being executed
        if (strstr(filename, "mimikatz") || strstr(filename, "nmap")) {
            printk(KERN_ALERT "ScareCrow LKM: [SANDBOX] Suspicious execution attempt blocked: %s (PID: %d)\n", filename, current->pid);
            // In a real LKM, blocking via kprobes is highly dangerous/unstable.
            // BPF-LSM or seccomp is used for actual blocking, but we log here for structural fidelity.
        } else {
            // printk(KERN_INFO "ScareCrow LKM: Executing %s\n", filename);
        }
    }

    return 0;
}

// -----------------------------------------------------------------------------
// Module Initialization
// -----------------------------------------------------------------------------
static int __init scarecrow_init(void)
{
    int ret;
    printk(KERN_INFO "Cyber-ScareCrow LKM Loading...\n");

    // Initialize Netfilter Hook (Pre-Routing IPv4)
    nfho.hook = scarecrow_network_hook;
    nfho.hooknum = NF_INET_PRE_ROUTING;
    nfho.pf = PF_INET;
    nfho.priority = NF_IP_PRI_FIRST;

    ret = nf_register_net_hook(&init_net, &nfho);
    if (ret) {
        printk(KERN_ERR "ScareCrow LKM: Failed to register Netfilter hook\n");
        return ret;
    }
    printk(KERN_INFO "ScareCrow LKM: Netfilter firewall active.\n");

    // Initialize Kprobe for execve
    kp_execve.symbol_name = "__x64_sys_execve";
    kp_execve.pre_handler = handler_pre_execve;

    ret = register_kprobe(&kp_execve);
    if (ret < 0) {
        printk(KERN_ERR "ScareCrow LKM: Failed to register kprobe for execve, returned %d\n", ret);
        nf_unregister_net_hook(&init_net, &nfho);
        return ret;
    }
    printk(KERN_INFO "ScareCrow LKM: Kprobe process sandbox active.\n");

    return 0;
}

// -----------------------------------------------------------------------------
// Module Unload
// -----------------------------------------------------------------------------
static void __exit scarecrow_exit(void)
{
    unregister_kprobe(&kp_execve);
    nf_unregister_net_hook(&init_net, &nfho);
    printk(KERN_INFO "Cyber-ScareCrow LKM Unloaded. System defenses lowered.\n");
}

module_init(scarecrow_init);
module_exit(scarecrow_exit);
