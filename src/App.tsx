import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Authenticator,withAuthenticator , Button,
  Flex,
  Image,
  Text,
  View,} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {Amplify, API,Storage} from 'aws-amplify/';
import awsExports from './aws-exports';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

Amplify.configure(awsExports);
const initialFormState = { name: '', description: '',image:'' }

function App() {
  const [notes, setNotes] = useState<any[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  useEffect(() => {
    fetchNotes();
  }, []);
  async function onChange(e:any) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }
  async function fetchNotes() {
    const apiData = await API.graphql<any>({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async (note:any) => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote( id:any ) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  return (
    <Authenticator>
     {({ signOut, user }) => (
          
<>
            {user && (
              <div style={styles.container}>
              <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      />
      <input
  type="file"
  onChange={onChange}
/>
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note.id)}>Delete note</button>
              {
        note.image && <img src={note.image} style={{width: 400}} />
      }
            </div>
          ))
        }
      </div>
 <button onClick={signOut}>Sign out</button>
              </div>
              )}
              </>
           
        )}
    </Authenticator>
  );
}

export default App
const styles = {
  container: { width: 480, margin: '0 auto', padding: 20 },
  form: { display: 'flex', marginBottom: 15 },
  input: { flexGrow: 2, border: 'none', backgroundColor: '#ddd', padding: 12, fontSize: 18 },
  addButton: { backgroundColor: 'black', color: 'white', outline: 'none', padding: 12, fontSize: 18 },
  note: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 22, marginBottom: 15 },
  deleteButton: { fontSize: 18, fontWeight: 'bold' }
}