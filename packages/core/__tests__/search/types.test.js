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
const path_1 = __importDefault(require("path"));
const getFilesList_1 = require("/getFilesList");
const fs_1 = __importDefault(require("fs"));
describe('Types', () => {
    let filesList = [];
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, '__fixtures__'));
    }));
    const tempFilePath = path_1.default.join(__dirname, `${Date.now()}.temp`);
    const mockFilesList = [tempFilePath];
    beforeAll(() => {
        fs_1.default.writeFileSync(tempFilePath, `
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never;

      type Generic<T extends B = C> = G

      const getInitialValues = (
        assignment: AssignmentPopulated,
      ): AssignmentFormValues => {
        if (!assignment) {
          return undefined;
        }
      };

      useAskToFillInForm<{
        noteFromTeam: string;
      }>({ asd })

      interface A extends B<C | number>{
        key: string;
        key_2: number;
      }

      interface B {
        key: string;
        key_2?: number;
      }

    `);
    });
    afterAll(() => {
        fs_1.default.unlinkSync(tempFilePath);
    });
    it('should match type that concatenates other type', () => {
        const queries = [
            `
      type $$ = ScrollViewProps & $$$
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match type concatenation with one wildcard with not matching order', () => {
        const queries = [
            `
      type $$ = $$$ & ScrollViewProps
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match string enumeration type with exact mode', () => {
        const queries = [
            `
      type $$ = "$$" | "$$"
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match string enumeration type with include mode', () => {
        const queries = [
            `
      type $$ = "$$" | "$$"
      `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(3);
    });
    it('should match generic type parametrization', () => {
        const queries = [
            `
        type $$ = {
          $$: $$<$$$>;
        };     
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(5);
    });
    it('should match indexed object type with wildcard', () => {
        const queries = [
            `
      type $$ = {
        [key: string]: $$$;
      };   
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match some indexed object type with partially wildcard identifier', () => {
        const queries = [
            `
      type $$Visibility = {
        [key: string]: boolean | undefined
      };   
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match some indexed object type', () => {
        const queries = [
            `
      type $$ = {
        [key: $$]: $$$
      };   
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match types union inside indexed object type', () => {
        const queries = [
            `
      type $$ = {
        [key: string]: boolean | $$;
      };   
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: filesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match some random generic type', () => {
        const queries = [
            `
      type ReturnTypeInferer<T> = T extends (a: Record<string, string>) => infer U ? U : never; 
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match wildcard as generic param', () => {
        const queries = [
            `
      type ReturnTypeInferer<$$> = $$ extends (a: Record<string, string>) => infer U ? U : never; 
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match wildcard as conditional extends part', () => {
        const queries = [
            `
      type ReturnTypeInferer<$$> = $$ extends $$$ ? U : never; 
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match wildcard in conditional type', () => {
        const queries = [
            `
      type $$<T> = T extends $$$ ? $$ : $$
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match wildcard as conditional type', () => {
        const queries = [
            `
      type $$<T> = $$$
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match type parameter wildcard', () => {
        const queries = [
            `
        type $$<$$$> = G
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match function declaration with returnType by query without returnType', () => {
        const queries = [
            `
        const getInitialValues = (
          assignment: AssignmentPopulated,
        ) => {
        
        };
       `
        ];
        const { matches: matchesInclude } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        const { matches: matchesExact } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matchesInclude.length).toBe(1);
        expect(matchesExact.length).toBe(0);
    });
    it('should match function declaration with param typeAnnotation by query without param typeAnnotation', () => {
        const queries = [
            `
        const getInitialValues = (
          assignment,
        ): AssignmentFormValues => {
        
        };
       `
        ];
        const { matches: matchesInclude } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        const { matches: matchesExact } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matchesInclude.length).toBe(1);
        expect(matchesExact.length).toBe(0);
    });
    it('should match function declaration with types by query without types', () => {
        const queries = [
            `
        const getInitialValues = (
          assignment,
        ) => {
        
        };
       `
        ];
        const { matches: matchesInclude } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        const { matches: matchesExact } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matchesInclude.length).toBe(1);
        expect(matchesExact.length).toBe(0);
    });
    it('should match call expression with typesParameters by query without typesParameters', () => {
        const queries = [
            `
        use$$Form$$()
       `
        ];
        const { matches: matchesInclude } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        const { matches: matchesExact } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matchesInclude.length).toBe(1);
        expect(matchesExact.length).toBe(0);
    });
    it('should match some interface', () => {
        const queries = [
            `
        interface $$ {
          $$_ref1: string
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match interface with wildcard in extends', () => {
        const queries = [
            `
        interface A extends $$$ {
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match interface with wildcard in extends with type param', () => {
        const queries = [
            `
        interface A extends $$<$$$> {
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match interface with extends with double wildcard', () => {
        const queries = [
            `
        interface $$$ {

        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(2);
    });
    it('should match optional interface filed in include mode 1', () => {
        const queries = [
            `
        interface B {
          key_2: number;
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match optional interface filed in include mode 2', () => {
        const queries = [
            `
        interface B {
          key_2?: number;
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'include',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should match optional interface filed in exact mode', () => {
        const queries = [
            `
        interface B {
          key:string;
          key_2?: number;
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(1);
    });
    it('should not match optional interface filed in exact mode if not marked as optional', () => {
        const queries = [
            `
        interface B {
          key:string;
          key_2: number;
        }
       `
        ];
        const { matches } = (0, searchInFs_1.searchInFileSystem)({
            mode: 'exact',
            filePaths: mockFilesList,
            queryCodes: queries
        });
        expect(matches.length).toBe(0);
    });
});
