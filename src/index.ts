import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest'
import {
  Request,
  Response,
} from 'apollo-server-env'

export class RESTDataSourcePlus extends RESTDataSource {
  // set auth token before send request
  protected willSendRequest(request: RequestOptions): void {
    request.headers.set('Authorization', this.context.token)
  }

  // parse array data with total count in header
  protected async didReceiveResponse<TResult = any>(
    response: Response,
    _request: Request,
  ): Promise<TResult> {
    if (response.ok) {
      const contentType = response.headers.get('Content-Type')
      if (
        contentType &&
        (contentType.startsWith('application/json') ||
          contentType.startsWith('application/hal+json'))
      ) {
        const totalCount = response.headers.get('x-total-count')
        const data = await response.json()
        if (totalCount && Array.isArray(data)) {
          return (({
            totalCount,
            data
          }) as any) as Promise<TResult>
        } else {
          return (data as any) as Promise<TResult>
        }
      }
      return (this.parseBody(response) as any) as Promise<TResult>
    } else {
      throw await this.errorFromResponse(response)
    }
  }
}
