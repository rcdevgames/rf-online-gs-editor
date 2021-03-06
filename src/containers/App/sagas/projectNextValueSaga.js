import { delay } from 'redux-saga';
import { Map } from 'immutable';
import { pick, omit } from 'lodash';

import apolloClient from '~/apollo';
import boxItemOutUpdate from '~/apollo/mutations/boxItemOut_update';
import itemRemoveFully from '~/apollo/mutations/item_remove_fully';
import itemRemoveVirtual from '~/apollo/mutations/item_remove_virtual';
import itemRestoreVirtual from '~/apollo/mutations/item_restore_virtual';
import itemUpdate from '~/apollo/mutations/item_update';
import storeUpdate from '~/apollo/mutations/store_update';
import storeCopy from '~/apollo/mutations/store_copy';
import resourceUpdate from '~/apollo/mutations/resource_update';
import mapSptUpdate from '~/apollo/mutations/mapspt_update';

import {
  take,
  all,
  fork,
  put,
  select,
  cancel,
  cancelled,
} from 'redux-saga/effects';

import {
  PROJECTS_NEXT_VALUES_CHANGE_PROP_VALUE,
  PROJECTS_NEXT_VALUES_CHANGE_NEXT_VALUE,
  PROJECTS_NEXT_VALUES_REMOVE_VIRTUAL,
  PROJECTS_NEXT_VALUES_RESTORE_VIRTUAL,
  PROJECTS_NEXT_VALUES_REMOVE_FULLY,
  IMMUTABLE_MAP,
  MAPSPT,
  ITEM,
  STORE,
  BOXITEMOUT,
  PROJECTS_NEXT_VALUES_COPY_AND_REDIRECT,
  PROJECTS_NEXT_VALUES_CREATE_MODEL_FILES_FROM_THIS_DATA,
  RESOURCE,
  PROJECTS_NEXT_VALUES_CREATE_MAPSPT,
} from '../constants';

import {
  projectsNextValuesChangeNextValue,
  projectsNextValuesChangeIsSaving,
  projectsNextValuesChangeIsError,
  projectsNextValuesChangeIsSaved,
  projectsNextValuesChangeErrorMessage,
} from '../actions';

import {
  makeSelectProjectsNextValues,
  makeSelectLocalSettings,
} from '../selectors';

import itemResolvers from './projectNextValue/itemResolvers';
import storeResolvers from './projectNextValue/storeResolvers';
import boxItemOutResolvers from './projectNextValue/boxItemOutResolvers';
import mapSptResolvers from './projectNextValue/mapSptResolvers';
import resourceResolvers from './projectNextValue/resourceResolvers';

import {
  projectsNextValuesChangeIsRemoving,
  projectsNextValuesChangeNextValueOnlyInState,
  projectsNextValuesChangeIsRestoring,
  projectsNextValuesChangeIsCopying,
  projectsNextValuesSubTaskChangeIsError,
  projectsNextValuesSubTaskChangeIsProcessing,
  projectsNextValuesSubTaskChangeErrorMessage,
} from '../actions/projectsNextValues';

import workerCreateModelFilesFromThisData from './projectNextValue/workerCreateModelFilesFromThisData';
import workerCreateMapSpt from './projectNextValue/workerCreateMapSpt';

const Workers = {};

const Resolvers = {
  [ITEM]: itemResolvers,
  [STORE]: storeResolvers,
  [BOXITEMOUT]: boxItemOutResolvers,
  [MAPSPT]: mapSptResolvers,
  [RESOURCE]: resourceResolvers,
};

const MutationUpdateQueries = {
  [ITEM]: itemUpdate,
  [STORE]: storeUpdate,
  [BOXITEMOUT]: boxItemOutUpdate,
  [RESOURCE]: resourceUpdate,
  [MAPSPT]: mapSptUpdate,
};

const MutationRemoveVirtualQueries = {
  [ITEM]: itemRemoveVirtual,
};

const MutationRemoveFullyQueries = {
  [ITEM]: itemRemoveFully,
};

const MutationRestoreVirtualQueries = {
  [ITEM]: itemRestoreVirtual,
};

const MutationCopyQueries = {
  [STORE]: storeCopy,
};

const PickFields = {
  [STORE]: ['client', 'server', 'npcharacter'],
};

const OmitFields = {};

export function* changeProp({
  projectId,
  propKey,
  propValue,
  subType,
  ...props
}) {
  const entry = props.entry instanceof Map ? props.entry : Map(props.entry);
  const projectsNextValues = yield select(makeSelectProjectsNextValues());
  const localSettings = yield select(makeSelectLocalSettings());

  try {
    const projectNextValue = projectsNextValues
      .getIn([projectId, entry.get('id')])
      .get('nextValue');

    const typeResolvers = Resolvers[subType];

    if (!typeResolvers) {
      throw new Error('Value resolvers not defined');
    }

    const resolver = typeResolvers[propKey] || (() => projectNextValue);
    const nextMap = resolver(projectNextValue, propValue, {
      localSettings,
      entry,
      nextValues: projectsNextValues.get(projectId, IMMUTABLE_MAP),
      ...props.additionalData,
    });

    yield put(
      projectsNextValuesChangeIsError(
        {
          projectId,
          keyId: entry.get('id'),
        },
        false,
      ),
    );

    yield put(
      projectsNextValuesChangeNextValue(
        {
          projectId,
          keyId: entry.get('id'),
          subType,
        },
        nextMap,
      ),
    );
  } catch (err) {
    console.error(err); // eslint-disable-line
    yield put(
      projectsNextValuesChangeIsError(
        {
          projectId,
          keyId: entry.get('id'),
        },
        true,
      ),
    );

    yield put(
      projectsNextValuesChangeErrorMessage(
        {
          projectId,
          keyId: entry.get('id'),
        },
        err.message,
      ),
    );
  }
}

export function* worker({ projectId, keyId, subType }) {
  yield delay(1500); // delay before start mutation
  const callAction = (action, value) => action({ projectId, keyId }, value);

  try {
    const projectsNextValues = yield select(makeSelectProjectsNextValues());
    const state = projectsNextValues.getIn([projectId, keyId]);

    // exit if state empty or already saved
    if (!state || !state.get('nextValue') || state.get('isSaved')) {
      return;
    }

    yield put(callAction(projectsNextValuesChangeIsSaving, true));
    yield put(callAction(projectsNextValuesChangeIsError, false));
    yield delay(1500); // delay before mutate

    const typeMutation = MutationUpdateQueries[subType];

    if (!typeMutation) {
      throw new Error('Value mutation not defined');
    }

    const nextValueJS = state.get('nextValue').toJS();

    // mutate server state
    yield apolloClient.mutate({
      mutation: typeMutation,
      variables: {
        id: keyId,
        values: omit(
          PickFields[subType]
            ? pick(nextValueJS, PickFields[subType])
            : nextValueJS,
          OmitFields[subType] || [],
        ),
      },
    });

    yield put(callAction(projectsNextValuesChangeIsSaving, false));
    yield put(callAction(projectsNextValuesChangeIsSaved, true));
  } catch (error) {
    yield put(callAction(projectsNextValuesChangeIsError, true));
    yield put(callAction(projectsNextValuesChangeErrorMessage, error.message));
    yield put(callAction(projectsNextValuesChangeIsSaving, false));
    console.error(error); // eslint-disable-line
  } finally {
    if (yield cancelled()) {
      yield put(callAction(projectsNextValuesChangeIsSaving, false));
    }
  }
}

export function* workerRemoveVirtual({ projectId, keyId, subType }) {
  const callAction = (action, value) => action({ projectId, keyId }, value);

  try {
    yield put(callAction(projectsNextValuesChangeIsError, false));
    yield put(callAction(projectsNextValuesChangeIsRemoving, true));

    const typeMutation = MutationRemoveVirtualQueries[subType];

    if (!typeMutation) {
      throw new Error('Remove virtual mutation not defined');
    }

    // mutate server state
    yield apolloClient.mutate({
      mutation: typeMutation,
      variables: { id: keyId },
    });

    const projectsNextValues = yield select(makeSelectProjectsNextValues());
    const projectNextValue = projectsNextValues.getIn(
      [projectId, keyId, 'nextValue'],
      IMMUTABLE_MAP,
    );

    yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    yield put(
      projectsNextValuesChangeNextValueOnlyInState(
        {
          projectId,
          keyId,
          subType,
        },
        projectNextValue.set('isRemoved', true),
      ),
    );
  } catch (error) {
    yield put(callAction(projectsNextValuesChangeIsError, true));
    yield put(callAction(projectsNextValuesChangeErrorMessage, error.message));
    yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    console.error(error); // eslint-disable-line
  } finally {
    if (yield cancelled()) {
      yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    }
  }
}

export function* workerRemoveFully({ projectId, keyId, subType }) {
  const callAction = (action, value) => action({ projectId, keyId }, value);

  try {
    yield put(callAction(projectsNextValuesChangeIsError, false));
    yield put(callAction(projectsNextValuesChangeIsRemoving, true));

    const typeMutation = MutationRemoveFullyQueries[subType];

    if (!typeMutation) {
      throw new Error('Remove fully mutation not defined');
    }

    // mutate server state
    yield apolloClient.mutate({
      mutation: typeMutation,
      variables: { id: keyId },
    });

    const projectsNextValues = yield select(makeSelectProjectsNextValues());
    const projectNextValue = projectsNextValues.getIn(
      [projectId, keyId, 'nextValue'],
      IMMUTABLE_MAP,
    );

    yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    yield put(
      projectsNextValuesChangeNextValueOnlyInState(
        {
          projectId,
          keyId,
          subType,
        },
        projectNextValue.set('isRemovedFully', true),
      ),
    );
  } catch (error) {
    yield put(callAction(projectsNextValuesChangeIsError, true));
    yield put(callAction(projectsNextValuesChangeErrorMessage, error.message));
    yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    console.error(error); // eslint-disable-line
  } finally {
    if (yield cancelled()) {
      yield put(callAction(projectsNextValuesChangeIsRemoving, false));
    }
  }
}

export function* workerRestoreVirtual({ projectId, keyId, subType }) {
  const callAction = (action, value) => action({ projectId, keyId }, value);

  try {
    yield put(callAction(projectsNextValuesChangeIsError, false));
    yield put(callAction(projectsNextValuesChangeIsRestoring, true));

    const typeMutation = MutationRestoreVirtualQueries[subType];

    if (!typeMutation) {
      throw new Error('Restore virtual mutation not defined');
    }

    // mutate server state
    yield apolloClient.mutate({
      mutation: typeMutation,
      variables: { id: keyId },
    });

    const projectsNextValues = yield select(makeSelectProjectsNextValues());
    const projectNextValue = projectsNextValues.getIn(
      [projectId, keyId, 'nextValue'],
      IMMUTABLE_MAP,
    );

    yield put(callAction(projectsNextValuesChangeIsRestoring, false));
    yield put(
      projectsNextValuesChangeNextValueOnlyInState(
        {
          projectId,
          keyId,
          subType,
        },
        projectNextValue.set('isRemoved', false),
      ),
    );
  } catch (error) {
    yield put(callAction(projectsNextValuesChangeIsError, true));
    yield put(callAction(projectsNextValuesChangeErrorMessage, error.message));
    yield put(callAction(projectsNextValuesChangeIsRestoring, false));
    console.error(error); // eslint-disable-line
  } finally {
    if (yield cancelled()) {
      yield put(callAction(projectsNextValuesChangeIsRestoring, false));
    }
  }
}

export function* workerCopyAndRedirect({ projectId, keyId, subType }) {
  const callAction = (action, value) => action({ projectId, keyId }, value);

  try {
    yield put(callAction(projectsNextValuesChangeIsError, false));
    yield put(callAction(projectsNextValuesChangeIsCopying, true));

    const typeMutation = MutationCopyQueries[subType];

    if (!typeMutation) {
      throw new Error('Copy mutation not defined');
    }

    // mutate server state
    yield apolloClient.mutate({
      mutation: typeMutation,
      variables: { id: keyId },
    });

    // const projectsNextValues = yield select(makeSelectProjectsNextValues());
    // const projectNextValue = projectsNextValues.getIn(
    //   [projectId, keyId, 'nextValue'],
    //   IMMUTABLE_MAP,
    // );

    yield put(callAction(projectsNextValuesChangeIsCopying, false));
    // TODO: redirect
    // console.log('well done, redirect to edit page');
  } catch (error) {
    yield put(callAction(projectsNextValuesChangeIsError, true));
    yield put(callAction(projectsNextValuesChangeErrorMessage, error.message));
    yield put(callAction(projectsNextValuesChangeIsCopying, false));
    console.error(error); // eslint-disable-line
  } finally {
    if (yield cancelled()) {
      yield put(callAction(projectsNextValuesChangeIsCopying, false));
    }
  }
}

/**
 * Watch `PROJECTS_NEXT_VALUES_CHANGE_PROP_VALUE` action & create fork to change data in nextValue state
 */
export function* watchChangeProp() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_CHANGE_PROP_VALUE);
    yield fork(changeProp, props);
  }
}

/**
 * Watch `PROJECTS_NEXT_VALUES_CHANGE_NEXT_VALUE` action & create fork to save data
 */
export function* watchChangeValue() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_CHANGE_NEXT_VALUE);
    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    Workers[mainKey] = yield fork(worker, props);
  }
}

export function* watchRemoveVirtual() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_REMOVE_VIRTUAL);
    props.keyId = props.entry.get('id');

    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}:removeVirtual`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    Workers[mainKey] = yield fork(workerRemoveVirtual, props);
  }
}

export function* watchRemoveFully() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_REMOVE_FULLY);
    props.keyId = props.entry.get('id');

    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}:removeFully`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    Workers[mainKey] = yield fork(workerRemoveFully, props);
  }
}

export function* watchRestoreVirtual() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_RESTORE_VIRTUAL);
    props.keyId = props.entry.get('id');

    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}:restoreVirtual`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    Workers[mainKey] = yield fork(workerRestoreVirtual, props);
  }
}

export function* watchCopyAndRedirect() {
  while (true) {
    const props = yield take(PROJECTS_NEXT_VALUES_COPY_AND_REDIRECT);
    props.keyId = props.entry.get('id');

    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}:copyAndRedirect`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    Workers[mainKey] = yield fork(workerCopyAndRedirect, props);
  }
}

export function* createWatchSpecial() {
  const actions = {
    [PROJECTS_NEXT_VALUES_CREATE_MODEL_FILES_FROM_THIS_DATA]: workerCreateModelFilesFromThisData,
    [PROJECTS_NEXT_VALUES_CREATE_MAPSPT]: workerCreateMapSpt,
  };

  const types = Object.keys(actions);

  const makeCallAction = ({ taskName, projectId, keyId }) => (action, value) =>
    action({ projectId, keyId, taskName }, value);

  const makeActions = callAction => ({
    changeToStarted: function* genChangeToStarted() {
      yield put(callAction(projectsNextValuesSubTaskChangeIsError, false));
      yield put(callAction(projectsNextValuesSubTaskChangeErrorMessage, ''));
      yield put(callAction(projectsNextValuesSubTaskChangeIsProcessing, true));
    },
    changeToFailed: function* genChangeToFailed(err) {
      yield put(
        callAction(projectsNextValuesSubTaskChangeErrorMessage, err.message),
      );
      yield put(callAction(projectsNextValuesSubTaskChangeIsError, true));
      yield put(callAction(projectsNextValuesSubTaskChangeIsProcessing, false));
    },
    changeToSuccess: function* genChangeToSuccess() {
      yield put(callAction(projectsNextValuesSubTaskChangeErrorMessage, ''));
      yield put(callAction(projectsNextValuesSubTaskChangeIsError, false));
      yield put(callAction(projectsNextValuesSubTaskChangeIsProcessing, false));
    },
    changeIsError: function* genChangeIsError(value) {
      yield put(callAction(projectsNextValuesSubTaskChangeIsError, value));
    },
    changeIsProcessing: function* genChangeIsProcessing(value) {
      yield put(callAction(projectsNextValuesSubTaskChangeIsProcessing, value));
    },
    changeErrorMessage: function* genChangeErrorMessage(value) {
      yield put(callAction(projectsNextValuesSubTaskChangeErrorMessage, value));
    },
  });

  while (true) {
    const props = yield take(types);
    props.keyId = props.entry.get('id');

    const { projectId, keyId } = props;
    const mainKey = `${projectId}:${keyId}:${props.type}`;

    if (Workers[mainKey]) {
      yield cancel(Workers[mainKey]);
      Workers[mainKey] = undefined;
    }

    const callAction = makeCallAction({
      taskName: props.propKey,
      projectId,
      keyId,
    });

    Workers[mainKey] = yield fork(actions[props.type], {
      ...props,
      actions: makeActions(callAction),
    });
  }
}

export default function* defaultSaga() {
  yield all([
    fork(watchChangeProp),
    fork(watchChangeValue),
    fork(watchRemoveVirtual),
    fork(watchRemoveFully),
    fork(watchRestoreVirtual),
    fork(watchCopyAndRedirect),
    fork(createWatchSpecial),
  ]);
}
