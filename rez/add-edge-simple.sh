#!/bin/bash

# Super simple script to add Edge Runtime to Next.js files
# Run this from the rez/ directory

echo "Adding Edge Runtime to files..."

# List of files to update
files=(
  "app/api/admin/deleteTask/route.ts"
  "app/api/admin/fetchAllTaskMasters/route.ts"
  "app/api/admin/fetchAllTasks/route.ts"
  "app/api/admin/toggleTaskMasterStatus/route.ts"
  "app/api/admin/updateTask/route.ts"
  "app/api/admin/updateTaskMaster/route.ts"
  "app/api/createTask/route.ts"
  "app/api/download/guide/route.ts"
  "app/api/download/playbook/route.ts"
  "app/api/fetchAllTaskCompletionsForRezTaskMaster/route.ts"
  "app/api/fetchAllTasksForRezTaskMaster/route.ts"
  "app/api/fireTriggerForAutomationB2/route.ts"
  "app/api/fireTriggerForAutomationP2/route.ts"
  "app/api/notifyRezTotifierOfNewAccount/route.ts"
  "app/api/notifyRezTotifierOfNewTask/route.ts"
  "app/api/notifyRezTotifierOfUpdatedOrDeletedTask/route.ts"
  "app/api/sendResendEmail/route.ts"
  "app/api/updateTask/route.ts"
  "app/admin/tasks/[taskId]/page.tsx"
  "app/tasks/edit/[taskId]/page.tsx"
)

updated=0
skipped=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if already has it
    if grep -q "export const runtime = 'edge'" "$file"; then
      echo "⏭️  Skip: $file"
      ((skipped++))
    else
      # Simply add the line at the very top
      echo "export const runtime = 'edge';" | cat - "$file" > temp && mv temp "$file"
      echo "✅ Done: $file"
      ((updated++))
    fi
  else
    echo "❌ Not found: $file"
  fi
done

echo ""
echo "Updated: $updated | Skipped: $skipped"
echo ""
echo "Run: git diff"