import { Flex, IconButton, Link, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { VscChromeClose } from 'react-icons/vsc'
import { Banner } from '../../../types'
import { eventBusInstance } from '../../../EventBus'

const backgroundColor: Record<Banner['type'], string> = {
  info: 'blue.600',
  warning: 'yellow.600',
  success: 'green.600',
  error: 'red.600',
}

export function Banners() {
  const [banners, setBanners] = useState<Array<Banner>>([])

  useEffect(() => {
    eventBusInstance.addListener('fetch:banners:response', setBanners)
    eventBusInstance.dispatch('fetch:banners:start')

    return () => {
      eventBusInstance.removeListener('fetch:banners:response', setBanners)
    }
  }, [])

  const closeBanner = useCallback((bannerId: string) => {
    setBanners((banners) => banners.filter((banner) => banner.id !== bannerId))
    eventBusInstance.dispatch('banner:close', bannerId)
  }, [])

  const clickedBannerLink = useCallback((bannerId: string) => {
    eventBusInstance.dispatch('banner:clicked-link', bannerId)
  }, [])

  return (
    <Flex width="100%" marginY={banners.length > 0 ? '6px' : 0}>
      {banners.map((banner) => (
        <Flex
          key={banner.id}
          backgroundColor={backgroundColor[banner.type]}
          width="100%"
          paddingX={'10px'}
          paddingY={'5px'}
          borderRadius={'5px'}
          justifyContent="flex-start"
          color="white"
        >
          <Flex flexWrap="wrap" gap="3px">
            {banner.items.map((item, idx) => {
              if (item.type === 'link') {
                return (
                  <Link
                    href={item.link}
                    textDecoration={'underline'}
                    _hover={{ color: 'gray.300' }}
                    onClick={() => clickedBannerLink(banner.id)}
                  >
                    {item.value}
                  </Link>
                )
              } else if (item.type === 'text') {
                return <Text key={idx}>{item.value}</Text>
              }
            })}
          </Flex>
          <IconButton
            colorScheme={'grey'}
            size="xs"
            variant={'ghost'}
            icon={<VscChromeClose />}
            onClick={() => closeBanner(banner.id)}
            aria-label="close banner"
            marginLeft={'auto'}
            width="auto"
          />
        </Flex>
      ))}
    </Flex>
  )
}
