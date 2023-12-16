import logo from './logo.svg';
import './App.css';
import React, {useEffect, useReducer} from 'react'; // A default import
import { API } from 'aws-amplify'; // Gives access to use to use the GraphQL
import { List, Input, Button } from 'antd'; // CSS For styles
import 'antd/dist/reset.css';
import { v4 as uuid } from 'uuid'
import { listNotes } from './graphql/queries'; // Queries from GraphQL Queries (list)
import { createNotes as CreateNote } from './graphql/mutations'; // Queries from GraphQL Queries (create)

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
}

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_NOTES': //IF NO ERROR
      return {
        ...state,
        notes: action.notes,
        loading: false
      };
    case 'ERROR': //IF ERROR
      return {
        ...state,
        loading: false,
        error: true
      };
    default:
      return {
        ...state,
      };
  }
};

const App = () => {

  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async() => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      });
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items });
    } catch (err) {
      console.log('error: ', err);
      dispatch({ type: 'ERROR' });
    }
  };

  useEffect(() => {fetchNotes()}, []); //Pull up notes when the display loads up.

  const styles = { // Custom Styles
    container: {padding: 20}
    ,input: {marginBottom: 10}
    ,item: { textAlign: 'left' }
    ,p: { color: '#1890ff' }
  };

  const renderItem = (item) => {
    return (
      <List.Item style={styles.item}>
      <List.Item.Meta
        title={item.name}
        description={item.description}
      />
      </List.Item>
    );
  };
  
  return (
    <>
      <div style={styles.container}>

        <List
          loading={state.loading}
          dataSource={state.notes}
          renderItem={renderItem}
        />

      </div>
    </>
  );
}

export default App;


/*
NOTESDATA (Sample Data)
{
  "data": {
    "listNotes": {
      "items": [
        {
          "id": "3fb75361-70a9-4877-be67-70ba0eac112a",
          "name": "Book flight",
          "description": "Flying to Paris on June 1 returning June 10",
          "completed": false
        }
      ]
    }
  }
}

*/