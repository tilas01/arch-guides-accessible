#!/bin/bash
# Script to archive third-party dependencies

echo "Archiving dependencies..."

# Dusky OS
if [ ! -d "dusky" ]; then
    git clone https://github.com/dusklinux/dusky.git
fi

# Kloak
if [ ! -d "kloak" ]; then
    git clone https://github.com/vmonaco/kloak.git
fi

# OpenDoas
if [ ! -d "OpenDoas" ]; then
    git clone https://github.com/Duncaen/OpenDoas.git
fi

echo "Archive complete."
