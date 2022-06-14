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
describe('code patterns', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    it('Should match function with redundant block statement', () => {
        const queries = [
            `
      const $$ = () => {
        return $$$
      };
      `,
            `const $$ = ($$$) => {
        return $$$
      };
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        const firstResult = `
      const DrawerContent = () => {
        return <PreferencesContext.Consumer>
            {preferences => <DrawerItems toggleTheme={preferences.toggleTheme} toggleRTL={preferences.toggleRtl} isRTL={preferences.rtl} isDarkTheme={preferences.theme.dark} />}
          </PreferencesContext.Consumer>;
      };
    `;
        expect(matches.length).toBe(10);
        expect((0, astUtils_1.compareCode)(matches[0].code, firstResult)).toBeTruthy();
    });
    it('should match possible falsy event listeners', () => {
        const queries = [
            `
      <$$
        $$={$$$ && $$$}
      />
    `,
            `
      <$$
        $$={$$$ && $$$}
      >
      </$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should find all empty event listeners', () => {
        const queries = [
            `
      <$$
        on$$={()=>{}}
      />
    `,
            `
      <$$
        on$$={()=>{}}
      >
      </$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(63);
    });
    it('should find all JSX props which always creates new reference', () => {
        const queries = [
            `
      <$$
        $$={()=>{}}
      />
    `,
            `
      <$$
        $$={()=>{}}
      >
      </$$>
    `,
            `
      <$$
        $$={[]}
      />
    `,
            `
      <$$
        $$={[]}
      >
      </$$>
    `,
            `
      <$$
        $$={{}}
      />
    `,
            `
      <$$
        $$={{}}
      >
      </$$>
    `,
            `
      <$$
        $$={$$$()}
      />
    `,
            `
      <$$
        $$={$$$()}
      >
      </$$>
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(132);
    });
    it('should match nested ternary operator', () => {
        const queries = [
            `
      $$$ ? $$$ : $$$ ? $$$ : $$$
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match cast to any', () => {
        const queries = [
            `
      ($$$ as any)
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should find all console logs', () => {
        const query = `
      console.log()
    `;
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: [query]
        });
        expect(matches.length).toBe(3);
        expect(matches[2].code).toBe("console.log('Pressed')");
    });
    it('Should find all requires of jpg assets', () => {
        const queries = [
            `
      require("$$assets$$.jpg")
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(6);
    });
    it('Should find all string concatenations using + operator', () => {
        const queries = [
            `
      "$$" + "$$"
    `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(0);
    });
});
