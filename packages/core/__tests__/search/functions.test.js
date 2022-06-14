"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const searchInFs_1 = require("/searchInFs");
const astUtils_1 = require("/astUtils");
const path_1 = __importDefault(require("path"));
const getFilesList_1 = require("/getFilesList");
const fs_1 = __importDefault(require("fs"));
describe('functions', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    const tempFilePath = path_1.default.join(__dirname, `${Date.now()}.temp`);
    const mockedFilesList = [tempFilePath];
    beforeAll(() => {
        fs_1.default.writeFileSync(tempFilePath, `
      (a,b,c) => {};
      (a,d) => {};
      (a, { b}) => {};

    `);
    });
    afterAll(() => {
        fs_1.default.unlinkSync(tempFilePath);
    });
    it('should match inline types in function params', () => {
        const queries = [
            `
      const $$ = ({
        $$,
      }: {
        $$: () => $$$;
      }) => $$$
      `,
            `
        const $$ = ({
          $$,
        }: {
          $$: () => $$$;
        }) => {}
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(4);
    });
    it('should match exact function with body', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
        setExtended(currentScrollPosition <= 0);
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
        expect((0, astUtils_1.compareCode)(matches[0].code, queries[0])).toBeTruthy();
    });
    it('should match function with body statements in order with exact statements', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
        setExtended(currentScrollPosition <= 0);

      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match function with body statements in order but without all statements', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should not match function with body statements in different order', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        setExtended(currentScrollPosition <= 0);

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(0);
    });
    it('should not match function with body statements in different order without all statements', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }

        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include-with-order',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(0);
    });
    it('should match function with body statements in different order', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
        setExtended(currentScrollPosition <= 0);

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }
      
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match function with body statements in different order without all statements', () => {
        const queries = [
            `
      const onScroll = ({
        nativeEvent
      }: NativeSyntheticEvent<NativeScrollEvent>) => {

        if (!isIOS) {
          return velocity.setValue(currentScrollPosition);
        }

        const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match function with 2 arguments', () => {
        const queries = [
            `
      ($$_ref1, $$_ref2) => {}
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockedFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match function with 2 arguments using double wildcard', () => {
        const queries = [
            `
      ($$_ref1, $$$_ref2) => {}
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockedFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(3);
    });
    it('should match function with 3 arguments', () => {
        const queries = [
            `
      ($$_ref1, $$_ref2, $$_ref3) => {}
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockedFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
});
