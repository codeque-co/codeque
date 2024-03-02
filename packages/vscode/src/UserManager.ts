import { Banner } from 'types'
import { eventBusInstance } from './EventBus'
import { TelemetryModule } from './telemetry'
import { UserStateManager } from './UserStateManager'

const userShouldSeeBannersAfterSearchesWithResultsCount = 3

export class UserManager {
  private banners: Banner[] | null = []
  constructor(
    private readonly userStateManager: UserStateManager,
    private readonly telemetryReporter: TelemetryModule,
  ) {
    eventBusInstance.addListener('fetch:banners:start', this.fetchBanners)
    eventBusInstance.addListener('banner:close', this.handleBannerClose)

    eventBusInstance.addListener(
      'banner:clicked-link',
      this.handleBannerLinkClick,
    )
  }

  private fetchBanners = () => {
    const { closedBannerIds, searchesWithResultsCount } =
      this.userStateManager.getState()

    if (
      searchesWithResultsCount >=
      userShouldSeeBannersAfterSearchesWithResultsCount
    ) {
      if (Array.isArray(this.banners)) {
        eventBusInstance.dispatch('fetch:banners:response', this.banners)
      }

      fetch('https://codeque.co/api/vscode/banners', {
        method: 'GET',
        mode: 'no-cors',
      })
        .then((response) => response.json())
        .then((data: { banners: Array<Banner> }) => {
          this.banners = data.banners.filter(
            (banner) => !closedBannerIds.includes(banner.id),
          )

          eventBusInstance.dispatch('fetch:banners:response', this.banners)
          this.telemetryReporter.reportBannersLoad()
        })
        .catch((e) => {
          eventBusInstance.dispatch('fetch:banners:response', [])
        })
    }
  }

  private handleBannerClose = (bannerId: string) => {
    if (Array.isArray(this.banners)) {
      this.banners = this.banners.filter((banner) => banner.id !== bannerId)
    }

    const closedBannerIds = this.userStateManager.getState().closedBannerIds

    this.userStateManager.setState({
      closedBannerIds: [...closedBannerIds, bannerId],
    })

    this.telemetryReporter.reportBannerClose(bannerId)
  }

  private handleBannerLinkClick = (bannerId: string) => {
    this.telemetryReporter.reportBannerLinkClick(bannerId)
  }

  public dispose() {
    eventBusInstance.removeListener('fetch:banners:start', this.fetchBanners)
  }
}
