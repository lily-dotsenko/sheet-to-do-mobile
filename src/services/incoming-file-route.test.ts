import { incomingFileRoute } from './incoming-file-route';

describe('incoming Sheet file routing', () => {
  test('routes Android content and file URIs to the confirmation screen', () => {
    expect(incomingFileRoute('content://chat.provider/files/My List.sheettodo')).toBe(
      '/import-file?uri=content%3A%2F%2Fchat.provider%2Ffiles%2FMy%20List.sheettodo',
    );
    expect(incomingFileRoute('file:///storage/emulated/0/Download/list.sheettodo')).toBe(
      '/import-file?uri=file%3A%2F%2F%2Fstorage%2Femulated%2F0%2FDownload%2Flist.sheettodo',
    );
  });

  test('does not intercept app deep links or web links', () => {
    expect(incomingFileRoute('sheettodo:///import?data=abc')).toBeNull();
    expect(incomingFileRoute('https://example.com/list')).toBeNull();
  });
});
