#!/bin/bash

# Script to fix Git commit history for wrong GitHub account
# This script helps you fix commits that were made with the wrong Git author information

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from within a git repository."
    exit 1
fi

# Print header
print_header "Git Author Fix Script"
echo "This script will help you fix commits that were made with the wrong Git author information."
echo

# Get current Git configuration
current_name=$(git config user.name)
current_email=$(git config user.email)

echo "Current Git configuration:"
echo "  Name:  $current_name"
echo "  Email: $current_email"
echo

# Get wrong and correct author information
read -p "Enter the wrong author name (leave blank to match any name): " wrong_name
read -p "Enter the wrong author email (leave blank to match any email): " wrong_email
echo

if [ -z "$wrong_name" ] && [ -z "$wrong_email" ]; then
    print_error "You must provide at least one of wrong name or wrong email."
    exit 1
fi

read -p "Enter the correct author name: " correct_name
read -p "Enter the correct author email: " correct_email
echo

if [ -z "$correct_name" ] || [ -z "$correct_email" ]; then
    print_error "Correct name and email are required."
    exit 1
fi

# Ask which method to use
echo "Choose a method to fix the commits:"
echo "1) Fix only the last commit"
echo "2) Fix multiple commits with interactive rebase"
echo "3) Fix all commits with git filter-branch"
echo "4) Fix all commits with git-filter-repo (recommended for large repositories)"
read -p "Enter your choice (1-4): " method
echo

case $method in
    1)
        print_header "Fixing the last commit"
        git commit --amend --author="$correct_name <$correct_email>" --no-edit
        print_success "Last commit fixed."
        ;;
    2)
        print_header "Fixing multiple commits with interactive rebase"
        read -p "How many commits do you want to fix? " num_commits
        
        if ! [[ "$num_commits" =~ ^[0-9]+$ ]]; then
            print_error "Please enter a valid number."
            exit 1
        fi
        
        echo "An editor will open. Change 'pick' to 'edit' for each commit you want to modify."
        read -p "Press Enter to continue..."
        
        git rebase -i HEAD~$num_commits
        
        print_warning "For each commit that stops for editing, run:"
        echo "git commit --amend --author=\"$correct_name <$correct_email>\" --no-edit"
        echo "git rebase --continue"
        print_warning "After fixing all commits, you'll need to force push with:"
        echo "git push --force-with-lease origin <branch>"
        ;;
    3)
        print_header "Fixing all commits with git filter-branch"
        
        filter_command="
        if [ \"\$GIT_COMMITTER_EMAIL\" = \"$wrong_email\" ]"
        
        if [ -n "$wrong_name" ]; then
            filter_command="$filter_command || [ \"\$GIT_COMMITTER_NAME\" = \"$wrong_name\" ]"
        fi
        
        filter_command="$filter_command
        then
            export GIT_COMMITTER_NAME=\"$correct_name\"
            export GIT_COMMITTER_EMAIL=\"$correct_email\"
        fi
        if [ \"\$GIT_AUTHOR_EMAIL\" = \"$wrong_email\" ]"
        
        if [ -n "$wrong_name" ]; then
            filter_command="$filter_command || [ \"\$GIT_AUTHOR_NAME\" = \"$wrong_name\" ]"
        fi
        
        filter_command="$filter_command
        then
            export GIT_AUTHOR_NAME=\"$correct_name\"
            export GIT_AUTHOR_EMAIL=\"$correct_email\"
        fi"
        
        print_warning "This will rewrite the entire repository history. It may take a while."
        read -p "Are you sure you want to continue? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            print_error "Operation cancelled."
            exit 1
        fi
        
        git filter-branch --env-filter "$filter_command" --tag-name-filter cat -- --branches --tags
        
        print_success "All commits fixed."
        print_warning "You'll need to force push with:"
        echo "git push --force-with-lease origin --all"
        echo "git push --force-with-lease origin --tags"
        ;;
    4)
        print_header "Fixing all commits with git-filter-repo"
        
        # Check if git-filter-repo is installed
        if ! command -v git-filter-repo &> /dev/null; then
            print_error "git-filter-repo is not installed. Install it with:"
            echo "pip install git-filter-repo"
            exit 1
        fi
        
        print_warning "This will rewrite the entire repository history. It may take a while."
        read -p "Are you sure you want to continue? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            print_error "Operation cancelled."
            exit 1
        fi
        
        # Create a temporary Python script for the callbacks
        cat > /tmp/git-filter-repo-callbacks.py << EOF
import re

def name_callback(name):
    if b"$wrong_name" and name == b"$wrong_name":
        return b"$correct_name"
    return name

def email_callback(email):
    if b"$wrong_email" and email == b"$wrong_email":
        return b"$correct_email"
    return email
EOF
        
        # Run git-filter-repo
        git filter-repo --name-callback "name_callback" --email-callback "email_callback" --force --python /tmp/git-filter-repo-callbacks.py
        
        # Clean up
        rm /tmp/git-filter-repo-callbacks.py
        
        print_success "All commits fixed."
        print_warning "You'll need to force push with:"
        echo "git push --force-with-lease origin --all"
        echo "git push --force-with-lease origin --tags"
        ;;
    *)
        print_error "Invalid choice."
        exit 1
        ;;
esac

# Update local Git configuration
read -p "Do you want to update the local Git configuration for this repository? (y/n): " update_config

if [ "$update_config" = "y" ]; then
    git config user.name "$correct_name"
    git config user.email "$correct_email"
    print_success "Local Git configuration updated."
fi

print_header "Next Steps"
echo "1. Review the changes to ensure they're correct:"
echo "   git log --author=\"$correct_name\""
echo
echo "2. If everything looks good, force push to update the remote repository:"
echo "   git push --force-with-lease origin <branch>"
echo
echo "3. If you have tags that need to be updated:"
echo "   git push --force-with-lease origin --tags"
echo

print_success "Done!"