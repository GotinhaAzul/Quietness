import test from 'node:test';
import assert from 'node:assert/strict';

const recovery = await import(
  new URL('./folderCrudRecovery.ts', import.meta.url).href
);
const { isPathInsideFolder, restoreFailedFolderMutation } = recovery;

test('isPathInsideFolder requires a path boundary after the folder name', () => {
  assert.equal(
    isPathInsideFolder('C:/Notes/Archive Plan.md', 'C:/Notes', 'Archive'),
    false,
  );
  assert.equal(
    isPathInsideFolder('C:/Notes/Archive/Plan.md', 'C:/Notes', 'Archive'),
    true,
  );
});

test('restoreFailedFolderMutation restores only state cleared before a failed mutation', () => {
  const previousCurrent = {
    name: 'Plan',
    path: 'C:/Notes/Archive/Plan.md',
    content: 'body',
  };

  assert.deepEqual(
    restoreFailedFolderMutation(previousCurrent, true, 'Archive', true),
    { currentNote: previousCurrent, selectedFolder: 'Archive' },
  );
  assert.deepEqual(
    restoreFailedFolderMutation(previousCurrent, false, 'Archive', false),
    { currentNote: null, selectedFolder: null },
  );
});

