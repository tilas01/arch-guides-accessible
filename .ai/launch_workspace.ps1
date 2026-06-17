param (
    [switch]$New = $false
)

$brainDir = "$env:USERPROFILE\.gemini\antigravity-ide\brain"
$workspaceDir = $PWD.Path

Write-Host "Arch Guides Dynamic - IDE Workspace Launcher" -ForegroundColor Cyan
Write-Host "============================================="

if ($New) {
    Write-Host "Launching a new IDE session in this workspace..."
    antigravity-ide .
    exit
}

if (Test-Path $brainDir) {
    Write-Host "Looking for previous conversations..."
    $conversations = Get-ChildItem -Path $brainDir -Directory
    
    if ($conversations.Count -gt 0) {
        Write-Host "`nFound the following previous conversation sessions:"
        $i = 1
        foreach ($conv in $conversations) {
            $ts = $conv.CreationTime
            Write-Host "[$i] ID: $($conv.Name) (Created: $ts)"
            $i++
        }
        Write-Host "[0] Launch a NEW conversation"
        
        $choice = Read-Host "`nSelect a conversation number to resume, or 0 for a new session"
        
        if ($choice -eq '0') {
            Write-Host "Launching new session..."
            antigravity-ide .
        } elseif ([int]$choice -gt 0 -and [int]$choice -le $conversations.Count) {
            $selected = $conversations[[int]$choice - 1].Name
            Write-Host "Resuming conversation: $selected"
            antigravity-ide --conversation $selected .
        } else {
            Write-Host "Invalid selection. Exiting."
        }
    } else {
        Write-Host "No previous conversations found. Launching new session..."
        antigravity-ide .
    }
} else {
    Write-Host "Brain directory not found. Launching new session..."
    antigravity-ide .
}
