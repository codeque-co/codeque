import { compareCode } from '/astUtils';

describe('AST utils', () => {
  it('should compare code as equal', () => {
    const code1 =
      `
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
    `

    const code2 =

      `
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
    `
    expect(compareCode(code1, code2)).toBeTruthy()
  })

  it('should compare code as unequal', () => {
    const code1 =
      `
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
    `

    const code2 = // no Colors import

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
    `
    expect(compareCode(code1, code2)).toBe(false)
  })
})