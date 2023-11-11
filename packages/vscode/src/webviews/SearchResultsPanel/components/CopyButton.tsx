import { IconButton, Tooltip } from '@chakra-ui/react'
import { MdContentCopy } from 'react-icons/md'
import { darkTheme, lightTheme } from '../../components/codeHighlightThemes'
import { useThemeType } from '../../components/useThemeType'
import { getIconButtonProps } from './utils'
import { useCopyToClipboard } from '../../components/useCopyToClipboard'

type CopyButtonProps = {
  value: string
  ariaLabel: string
  onCopyText?: string
}

export function CopyButton({
  value,
  ariaLabel,
  onCopyText = 'Copied to clipboard!',
}: CopyButtonProps) {
  const themeType = useThemeType()
  const isDarkTheme = themeType === 'dark'
  const highlightTheme = isDarkTheme ? darkTheme : lightTheme

  const iconButtonStyleResetProps = getIconButtonProps(
    highlightTheme.plain.backgroundColor,
  )
  const [hasCopiedValue, copyValue] = useCopyToClipboard(value)

  return (
    <Tooltip isOpen={hasCopiedValue} label={onCopyText} placement="left">
      <IconButton
        aria-label={ariaLabel}
        icon={<MdContentCopy />}
        {...iconButtonStyleResetProps}
        onClick={copyValue}
      />
    </Tooltip>
  )
}
