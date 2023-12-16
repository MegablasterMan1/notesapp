import logo from './logo.svg';
import './App.css';
import React, {useEffect, useReducer} from 'react'; // A default import
import { API } from 'aws-amplify'; // Gives access to use to use the GraphQL
import { List, Input, Button } from 'antd'; // CSS For styles
import 'antd/dist/reset.css';
import { v4 as uuid } from 'uuid'
import { listNotes } from './graphql/queries'; // Queries from GraphQL Queries (list)
import { createNote as CreateNote } from './graphql/mutations'; // Queries from GraphQL Queries (create)

const CLIENT_ID = uuid();

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
}

const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_NOTES': //IF NO ERROR
      return { ...state, notes: action.notes, loading: false};
    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes]};
    case 'RESET_FORM':
      return { ...state, form: initialState.form };
    case 'SET_INPUT':
      return { ...state, form: { ...state.form, [action.name]: action.value } };
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

  const createNote = async() => {
    const { form } = state

    if (!form.name || !form.description) {
      return alert('please enter a name and description');
    }

    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() };
    dispatch({ type: 'ADD_NOTE', note });
    dispatch({ type: 'RESET_FORM' });

    try {
      await API.graphql({
      query: CreateNote,
      variables: { input: note }
      });
      console.log('successfully created note!');
    } catch (err) {
      console.log("error: ", err);
    }
  };

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

  const onChange = (e) => {
    dispatch({ type: 'SET_INPUT', name: e.target.name, value: e.target.value })
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
      <div style={styles.container}>

        <Input
          onChange={onChange}
          value={state.form.name}
          placeholder="Note Name"
          name='name'
          style={styles.input}
        />

        <Input
          onChange={onChange}
          value={state.form.description}
          placeholder="Note description"
          name='description'
          style={styles.input}
        />

        <Button
          onClick={createNote}
          type="primary"
        >Create Note</Button>

        <List
          loading={state.loading}
          dataSource={state.notes}
          renderItem={renderItem}

        />
      </div>
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