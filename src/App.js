import logo from './logo.svg';
import './App.css';
import React, {useEffect, useReducer} from 'react'; // A default import
import { API } from 'aws-amplify'; // Gives access to use to use the GraphQL
import { List, Input, Button, Checkbox } from 'antd'; // CSS For styles
import 'antd/dist/reset.css';
import { v4 as uuid } from 'uuid'
import { listNotes } from './graphql/queries'; // Queries from GraphQL Queries (list)
import { onCreateNote, onDeleteNote } from './graphql/subscriptions' // Real Time Subscriptions
import { createNote as CreateNote } from './graphql/mutations'; // Queries from GraphQL Queries (create)
import { deleteNote as DeleteNote } from './graphql/mutations'; // Queries from GraphQL Queries (Delete)
import { updateNote as UpdateNote } from './graphql/mutations'; // Queries from GraphQL Queries (Update)

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
    case 'ADD_EXCLAMATION':
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
  const [checked, setChecked] = React.useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Updating Notes (GraphQL Mutation)
  const updateNote= async(note) => {
    const index = state.notes.findIndex(n => n.id === note.id);
    const notes = [...state.notes]
    notes[index].completed = !note.completed
    dispatch({ type: 'SET_NOTES', notes})
    try {
      await API.graphql({
        query: UpdateNote,
        variables: { input: { id: note.id, completed: notes[index].completed, warned: notes[index].warned } }
      })
      console.log('note successfully updated!');
    } catch (err) {
      console.log('error: ', err);
    }
  };

  // Real-Time Change (GraphQL Subscriptions)
  const exclamNote= async(note) => {
    const index = state.notes.findIndex(n => n.id === note.id);
    const notes = [...state.notes];

    const checkValue = (n) => {
      const x = n.name.replace(/!+$/, '');
      return n.warned ? `${x}!!!` : x;
    };

    notes[index].warned = !note.warned;
    notes[index].name = checkValue(note);
    dispatch({ type: 'SET_NOTES', notes})
    try {
      await API.graphql({
        query: UpdateNote,
        variables: { input: { id: note.id, warned: notes[index].warned }}
      })
      console.log('exlamation note updated!', note.warned);
    } catch (err) {
      console.log('error: ', err);
    }
  };

  // Deleting Notes (GraphQL Mutation)
  const deleteNote = async({ id }) => {
    const index = state.notes.findIndex(n => n.id === id);
    const notes = [
      ...state.notes.slice(0, index), // maybe change to a filter?
      ...state.notes.slice(index + 1)];
    dispatch({ type: 'SET_NOTES', notes });
    try {
      await API.graphql({
        query: DeleteNote,
        variables: { input: { id } }
      })
      console.log('successfully deleted note!');
      } catch (err) {
        console.log("error: ", err);
    }
  };

  // Creating Notes (GraphQL Mutation)
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

  // Listing Notes (GraphQL Query)
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

  // Real-Time Data (GraphQL Subscriptions)
  useEffect(() => {
    fetchNotes();
  
    const addSubscription = API.graphql({
      query: onCreateNote,
    }).subscribe({
      next: noteData => {
        const note = noteData.value.data.onCreateNote;
        if (CLIENT_ID === note.clientId) return;
        dispatch({ type: 'ADD_NOTE', note });
      },
    });
  
    const deleteSubscription = API.graphql({
      query: onDeleteNote,
    }).subscribe({
      next: noteData => {
        const removed_note = noteData.value.data.onDeleteNote.id;
        dispatch({ type: 'DELETE_NOTE', removed_note });
      },
    });
  
    return () => {
      addSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, []); //Pull up notes when the display loads up.

  const styles = { // Custom Styles
    container: {padding: 20}
    ,input: {marginBottom: 10}
    ,item: { textAlign: 'left' }
    ,p: { color: '#1890ff' }
  };

  const warningStyles = { // Custom Styles
    p: { color: 'Red' }
  };
  const happyStyles = { // Custom Styles
    p: { color: 'Green' }
  };
  const blandStyles = { // Custom Styles
    p: { color: 'Grey' }
  };

  const renderItem = (item) => {
    return (
      <List.Item
        style={styles.item}
        actions={[
          <div style={styles.p} onClick={() => deleteNote(item)}>Delete</div>,
          <div style={styles.p} onClick={() => updateNote(item)}>
            {item.completed ?
              <p style={happyStyles.p}>Done</p>
              :
              <p style={blandStyles.p}>Not Done</p>
            }
          </div>,
          <div style={styles.p} onClick={() => exclamNote(item)}>
            {item.warned ?
              <p style={warningStyles.p}>!!!</p>
              :
              <p style={blandStyles.p}>...</p>
            }
          </div>
        ]}
      >
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