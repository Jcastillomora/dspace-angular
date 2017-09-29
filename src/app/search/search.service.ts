import { Injectable } from '@angular/core';
import { RemoteData } from '../core/data/remote-data';
import { Observable } from 'rxjs/Observable';
import { SearchResult } from './search-result.model';
import { ItemDataService } from '../core/data/item-data.service';
import { PageInfo } from '../core/shared/page-info.model';
import { DSpaceObject } from '../core/shared/dspace-object.model';
import { SearchOptions } from './search-options.model';
import { hasValue, isNotEmpty } from '../shared/empty.util';
import { Metadatum } from '../core/shared/metadatum.model';
import { Item } from '../core/shared/item.model';
import { ItemSearchResult } from '../object-list/search-result-list-element/item-search-result/item-search-result.model';

function shuffle(array: any[]) {
  let i = 0;
  let j = 0;
  let temp = null;

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

@Injectable()
export class SearchService {

  totalPages = 5;
  mockedHighlights: string[] = new Array(
    'This is a <em>sample abstract</em>.',
    'This is a sample abstract. But, to fill up some space, here\'s <em>"Hello"</em> in several different languages : ',
    'This is a Sample HTML webpage including several <em>images</em> and styles (CSS).',
    'This is <em>really</em> just a sample abstract. But, Í’vé thrown ïn a cõuple of spëciâl charactèrs för êxtrå fuñ!',
    'This abstract is <em>really quite great</em>',
    'The solution structure of the <em>bee</em> venom neurotoxin',
    'BACKGROUND: The <em>Open Archive Initiative (OAI)</em> refers to a movement started around the \'90 s to guarantee free access to scientific information',
    'The collision fault detection of a <em>XXY</em> stage is proposed for the first time in this paper',
    '<em>This was blank in the actual item, no abstract</em>',
    '<em>The QSAR DataBank (QsarDB) repository</em>',
  );

  constructor(private itemDataService: ItemDataService) {

  }

  search(query: string, scopeId?: string, searchOptions?: SearchOptions): RemoteData<Array<SearchResult<DSpaceObject>>> {
    let self = `https://dspace7.4science.it/dspace-spring-rest/api/search?query=${query}`;
    if (hasValue(scopeId)) {
      self += `&scope=${scopeId}`;
    }
    if (isNotEmpty(searchOptions) && hasValue(searchOptions.pagination.currentPage)) {
      self += `&page=${searchOptions.pagination.currentPage}`;
    }
    if (isNotEmpty(searchOptions) && hasValue(searchOptions.pagination.pageSize)) {
      self += `&pageSize=${searchOptions.pagination.pageSize}`;
    }
    if (isNotEmpty(searchOptions) && hasValue(searchOptions.sort.direction)) {
      self += `&sortDirection=${searchOptions.sort.direction}`;
    }
    if (isNotEmpty(searchOptions) && hasValue(searchOptions.sort.field)) {
      self += `&sortField=${searchOptions.sort.field}`;
    }
    const requestPending = Observable.of(false);
    const responsePending = Observable.of(false);
    const errorMessage = Observable.of(undefined);
    const statusCode = Observable.of('200');
    const returningPageInfo = new PageInfo();

    if (isNotEmpty(searchOptions)) {
      returningPageInfo.elementsPerPage = searchOptions.pagination.pageSize;
      returningPageInfo.currentPage = searchOptions.pagination.currentPage;
    } else {
      returningPageInfo.elementsPerPage = 10;
      returningPageInfo.currentPage = 1;
    }

    const itemsRD = this.itemDataService.findAll({
      scopeID: scopeId,
      currentPage: returningPageInfo.currentPage,
      elementsPerPage: returningPageInfo.elementsPerPage
    });

    const pageInfo = itemsRD.pageInfo.map((info: PageInfo) => {
      info.totalElements = info.totalElements > 20 ? 20 : info.totalElements;
      return info;
    });

    const payload = itemsRD.payload.map((items: Item[]) => {
      return shuffle(items)
        .map((item: Item, index: number) => {
          const mockResult: SearchResult<DSpaceObject> = new ItemSearchResult();
          mockResult.dspaceObject = item;
          const highlight = new Metadatum();
          highlight.key = 'dc.description.abstract';
          highlight.value = this.mockedHighlights[index % this.mockedHighlights.length];
          mockResult.hitHighlights = new Array(highlight);
          return mockResult;
        });
    });

    return new RemoteData(
      self,
      requestPending,
      responsePending,
      itemsRD.hasSucceeded,
      errorMessage,
      statusCode,
      pageInfo,
      payload
    )
  }
}
