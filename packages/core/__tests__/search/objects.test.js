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
const fs_1 = __importDefault(require("fs"));
const getFilesList_1 = require("/getFilesList");
describe('Types', () => {
    const tempFilePath = path_1.default.join(__dirname, `${Date.now()}.temp`);
    const filesList = [tempFilePath];
    beforeAll(() => {
        fs_1.default.writeFileSync(tempFilePath, `
      ({
        a : {
          b : {
            a : {
              b : {
                a : {
                  b : {

                  }
                }
              }
            }
          }
        }
      });

      const obj = {
        someKey: someVal,
        someOtherKey: {
          a:5
        },
        other: 'other'
      }

      const objWithFn = {
        someKey: someVal,
        fn: () => obj.other
      }

      const objWithEquivalentKeys1 = {
        5: "val1",
      }

      const objWithEquivalentKeys2 = {
        ["5"]: "val2",
      }

      const objWithEquivalentKeys3 = {
        "5": "val3"
      }

      const objWithEquivalentKeys4 = {
        "aaa": "val4"
      }

      const objWithEquivalentKeys5 = {
        aaa: "val5"
      }
    `);
    });
    afterAll(() => {
        fs_1.default.unlinkSync(tempFilePath);
    });
    it('should match exact object', () => {
        const queries = [
            `
      ({
        someKey: someVal,
        someOtherKey: {
          a:5
        },
        other: 'other'
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match exact object case insensitive', () => {
        const queries = [
            `
      ({
        somekey: SomeVal,
        someOtherKey: {
          A:5
        },
        other: 'OTHER'
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            caseInsensitive: true,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match nested object property with wildcard', () => {
        const queries = [
            `
      ({
        someOtherKey: {
          $$:5
        },
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match nested object with wildcard', () => {
        const queries = [
            `
      ({
        someOtherKey: $$$,
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should find repeating pattern in nested object several times', () => {
        const queries = [
            `
      ({
        a: $$$,
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        const firstMatch = `
      ({
        a : {
          b : {
            a : {
              b : {
                a : {
                  b : {

                  }
                }
              }
            }
          }
        }
      });
    `;
        expect(matches.length).toBe(4);
        expect((0, astUtils_1.compareCode)(`(${matches[0].code})`, firstMatch)).toBeTruthy();
    });
    it('should not match object if query is block statement', () => {
        const queries = [
            `
      {}
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(0);
    });
    it('should match function in object', () => {
        const queries = [
            `
      ({
        $$: $$,
        $$: () => $$$
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match possibly repeated object properties', () => __awaiter(void 0, void 0, void 0, function* () {
        const filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
        const queries = [
            `
      StyleSheet.create({
        $$: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    }));
    it('should match equivalent object keys', () => {
        const queries = [
            `
      ({
        5: $$$
      })
      `,
            `
      ({
        aaa: "val$$"
      })
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(5);
    });
});
