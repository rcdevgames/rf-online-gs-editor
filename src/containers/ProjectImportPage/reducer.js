/*
 *
 * ProjectImportPage reducer
 *
 */

import { fromJS } from 'immutable';
import { ANNOUNCE_PROJECT_COUNT_ITEMS, SKIP } from '../App/constants';

import {
  DEFAULT_ACTION,
  CHANGE_ID,
  CHANGE_FIELD_VALUE,
  CHANGE_PROJECT,
} from './constants';

export const initialState = fromJS({
  id: '',
  project: null,
  isLoading: false,
  isLoaded: false,
  isError: false,
  errorMessage: '',
  importType: SKIP,
});

function projectImportPageReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_ID:
      return state
        .set('id', action.id)
        .set('project', null)
        .set('isLoaded', false);
    case CHANGE_FIELD_VALUE:
      return state.set(action.key, action.value);
    case CHANGE_PROJECT:
      return state.set('project', fromJS(action.project));
    case ANNOUNCE_PROJECT_COUNT_ITEMS:
      return state.set(
        'project',
        state.getIn(['project', 'id']) === action.id
          ? state.get('project').setIn(['items', 'total'], action.count)
          : state.get('project'),
      );
    case DEFAULT_ACTION:
      return state;
    default:
      return state;
  }
}

export default projectImportPageReducer;
