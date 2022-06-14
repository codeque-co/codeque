"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astUtils_1 = require("/astUtils");
describe('AST utils', () => {
    it('should compare code as equal', () => {
        const code1 = `
      import * as React from 'react';
      import { Paragraph, Button, Portal, Dialog, Colors } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `;
        const code2 = `
      import * as React from 'react';
      import { 
        Paragraph,
         Button, 
         Portal, 
         Dialog, 
         Colors 
        } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>This is a dialog with custom colors</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `;
        expect((0, astUtils_1.compareCode)(code1, code2)).toBeTruthy();
    });
    it('should compare code as unequal', () => {
        const code1 = `
      import * as React from 'react';
      import { Paragraph, Button, Portal, Dialog, Colors } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `;
        const code2 = 
        // no Colors import
        `
      import * as React from 'react';
      import { 
        Paragraph, 
        Button, 
        Portal, 
        Dialog 
      } from 'react-native-paper';

      const DialogWithCustomColors = ({
        visible,
        close,
      }: {
        visible: boolean;
        close: () => void;
      }) => (
        <Portal>
          <Dialog
            onDismiss={close}
            style={{ backgroundColor: Colors.purple900 }}
            visible={visible}
          >
            <Dialog.Title style={{ color: Colors.white }}>Alert</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: Colors.white }}>
                This is a dialog with custom colors
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button color={Colors.white} onPress={close}>
                OK
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      );

      export default DialogWithCustomColors;
    `;
        expect((0, astUtils_1.compareCode)(code1, code2)).toBe(false);
    });
    it('should remove identifier ref from wildcard', () => {
        expect((0, astUtils_1.removeIdentifierRefFromWildcard)('$$$_ref1')).toBe('$$$');
        expect((0, astUtils_1.removeIdentifierRefFromWildcard)('$$_ref1')).toBe('$$');
        expect((0, astUtils_1.removeIdentifierRefFromWildcard)('$$something')).toBe('$$something');
        expect((0, astUtils_1.removeIdentifierRefFromWildcard)('$$_something')).toBe('$$');
        expect((0, astUtils_1.removeIdentifierRefFromWildcard)('asd$$_ref')).toBe('asd$$_ref');
    });
});
