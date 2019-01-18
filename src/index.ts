import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest'
import { Request, Response } from 'apollo-server-env'

export class RESTDataSourcePlus extends RESTDataSource {
  private field: string
  constructor(field: string = 'data') {
    super()
    this.field = field
  }
  // set auth token before send request
  protected willSendRequest(request: RequestOptions): void {
    request.headers.set('Authorization', this.context.token)
  }

  // parse array data with total count in header
  protected async didReceiveResponse<TResult = any>(
    response: Response,
    request: Request
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
          return ({
            totalCount,
            [this.field]: data
          } as any) as Promise<TResult>
        }
        return (data as any) as Promise<TResult>
      }
      return (this.parseBody(response) as any) as Promise<TResult>
    }
    throw await this.errorFromResponse(response)
  }
}

export class ReadonlyDataSource extends RESTDataSourcePlus {
  private resource: string

  constructor(baseUrl: string, resource: string, field: string = 'data') {
    super(field)
    this.baseURL = baseUrl
    this.resource = resource
  }

  async list<TResult = any>(limit: number, offset: number): Promise<TResult> {
    return this.get<TResult>(this.resource, {
      limit,
      offset
    })
  }

  async retrieve<TResult = any>(id: string): Promise<TResult> {
    return this.get<TResult>(`${this.resource}/${id}`)
  }
}
