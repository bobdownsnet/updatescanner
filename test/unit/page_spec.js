import {Page} from 'page/page';
import {Storage} from 'util/storage';
import * as log from 'util/log';

describe('Page', function() {
  describe('load', function() {
    it('loads a Page from storage', function(done) {
      const id = '42';
      const data = {title: 'Page Title',
                    url: 'https://example.com/test',
                    };
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(data));

      Page.load(id).then((page) => {
        expect(Storage.load).toHaveBeenCalledWith(Page._KEY(id));
        expect(page.id).toEqual(id);
        expect(page.title).toEqual(data.title);
        expect(page.url).toEqual(data.url);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default Page if there is no object in storage',
       function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.resolve(undefined));

      Page.load('42').then((page) => {
        expect(page.title).toEqual('New Page');
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('returns the default Page if the storage load fails', function(done) {
      spyOn(Storage, 'load').and.returnValues(Promise.reject('ERROR_MESSAGE'));
      spyOn(log, 'log');

      Page.load('42').then((page) => {
        expect(page.title).toEqual('New Page');
        expect(log.log.calls.argsFor(0)).toMatch('ERROR_MESSAGE');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('save', function() {
    it('saves a Page to storage', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.resolve());
      const id = 33;
      const data = {title: 'A Page',
                    url: 'https://www.example.com/test',
                    changeThreshold: 1234,
                    scanRateMinutes: 64,
                    state: Page.stateEnum.NO_CHANGE,
                    error: true,
                    errorMessage: 'This is an error',
                    lastAutoscanTime: 10209876,
                    oldScanTime: 9381234,
                    newScanTime: 40834321,
                    };
      const page = new Page(id, data);

      page.save().then(() => {
        expect(Storage.save).toHaveBeenCalledWith(Page._KEY(id), data);
        done();
      })
      .catch((error) => done.fail(error));
    });

    it('silently logs an error if the save fails', function(done) {
      spyOn(Storage, 'save').and.returnValues(Promise.reject('AN_ERROR'));
      spyOn(log, 'log');

      new Page('37').save().then(() => {
        expect(log.log.calls.argsFor(0)).toMatch('AN_ERROR');
        done();
      })
      .catch((error) => done.fail(error));
    });
  });

  describe('idFromKey', function() {
    it('extracts the id from a Page key', function() {
      const key = Page._KEY('987');
      const id = Page.idFromKey(key);
      expect(id).toEqual('987');
    });

    it('returns null if the key is invalid', function() {
      const key = 'invalid:987';
      const id = Page.idFromKey(key);
      expect(id).toBeNull;
    });
  });
});
