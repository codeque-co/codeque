import {
  Flex,
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { HiOutlineChevronDown } from 'react-icons/hi'

export type ButtonWithOptionSelectProps<T> = Pick<
  ButtonProps,
  'colorScheme' | 'size' | 'loadingText' | 'isLoading' | 'disabled'
> & {
  selectedOptionValue: string
  options: Array<{ label: string; value: T }>
  onClick: () => void
  onOptionSelect: (value: T) => void
}

export function ButtonWithOptionSelect<T extends string>({
  onClick,
  onOptionSelect,
  selectedOptionValue,
  colorScheme,
  size,
  options,
  loadingText,
  disabled,
  isLoading,
}: ButtonWithOptionSelectProps<T>) {
  const colors = {
    menuItemBgColor: `${colorScheme}.500`,
    menuItemBgColorActive: `${colorScheme}.700`,
  }

  const selectedOptionLabel = options.find(
    (option) => option.value === selectedOptionValue,
  )

  return (
    <Flex width="100%">
      <Button
        colorScheme={colorScheme}
        size={size}
        borderTopRightRadius="0px"
        borderBottomRightRadius="0px"
        paddingRight={'3px'}
        onClick={onClick}
        isLoading={isLoading}
        disabled={disabled}
        loadingText={loadingText}
      >
        {selectedOptionLabel?.label ?? selectedOptionValue}
      </Button>
      <Menu colorScheme={'purple'}>
        {({ isOpen }) => (
          <>
            <MenuButton
              isActive={isOpen}
              as={Button}
              colorScheme={colorScheme}
              size={size}
              width="30px"
              paddingLeft={'3px'}
              borderTopLeftRadius="0px"
              borderBottomLeftRadius="0px"
              disabled={isLoading || disabled}
            >
              {<HiOutlineChevronDown></HiOutlineChevronDown>}
            </MenuButton>
            <MenuList
              backgroundColor={colors.menuItemBgColor}
              borderColor={colors.menuItemBgColorActive}
            >
              {options.map((option) => (
                <MenuItem
                  key={option.value}
                  backgroundColor={colors.menuItemBgColor}
                  color="white"
                  _hover={{ backgroundColor: colors.menuItemBgColorActive }}
                  _active={{ backgroundColor: colors.menuItemBgColorActive }}
                  _focus={{ backgroundColor: colors.menuItemBgColorActive }}
                  borderRadius="5px"
                  onClick={() => onOptionSelect(option.value)}
                >
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          </>
        )}
      </Menu>
    </Flex>
  )
}
