import { connect } from '@app/store';
import CountComponent from './Count';

export const Count = connect(state => ({
  total: state.results.data.total,
  loading: state.results.loading,
}))(CountComponent);
