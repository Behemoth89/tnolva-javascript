## 1. Data Model Updates

- [ ] 1.1 Add completionDate field to ITaskEntity interface (`src/interfaces/entities/ITaskEntity.ts`)
- [ ] 1.2 Add completionDate property to Task class (`src/domain/Task.ts`)
- [ ] 1.3 Update toObject() method in Task class to include completionDate

## 2. DTO Updates

- [ ] 2.1 Add completionDate to ITaskCreateDto (`src/interfaces/dtos/ITaskCreateDto.ts`)
- [ ] 2.2 Add completionDate to ITaskUpdateDto (`src/interfaces/dtos/ITaskUpdateDto.ts`)
- [ ] 2.3 Add completionDate to IBllTaskCreateDto (`src/bll/interfaces/dtos/IBllTaskCreateDto.ts`)
- [ ] 2.4 Add completionDate to IBllTaskUpdateDto (`src/bll/interfaces/dtos/IBllTaskUpdateDto.ts`)
- [ ] 2.5 Add completionDate to IBllTaskDto (`src/bll/interfaces/dtos/IBllTaskDto.ts`)

## 3. TaskService Updates

- [ ] 3.1 Update completeAsync() to automatically set completionDate to current date when marking task DONE
- [ ] 3.2 Update updateAsync() to handle completionDate when status is changed to DONE (auto-set if not provided)
- [ ] 3.3 Update updateAsync() to clear completionDate when status is changed from DONE to another status
- [ ] 3.4 Update mapToBllTaskDto() to include completionDate in mapping

## 4. Unit of Work Updates

- [ ] 4.1 Update completeTaskWithRecurrenceAsync() to set completionDate when completing recurring task

## 5. UI Date Filtering Fix

- [ ] 5.1 Update applyDateRangeFilter() in `src/ui/pages/index.ts` to use overlap-based filtering
- [ ] 5.2 Add logic to use completionDate for DONE tasks as the end date
- [ ] 5.3 Add logic to use dueDate (or 01.01.3000 if not set) for non-DONE tasks as the end date
- [ ] 5.4 Test date filtering shows tasks with dates in the selected range

## 6. Verification

- [ ] 6.1 Verify new tasks can be created with completionDate
- [ ] 6.2 Verify marking task as DONE sets completionDate automatically
- [ ] 6.3 Verify manual completionDate override works when marking done
- [ ] 6.4 Verify date filtering works correctly for DONE tasks (uses completionDate)
- [ ] 6.5 Verify date filtering works correctly for non-DONE tasks (uses dueDate or 01.01.3000)
