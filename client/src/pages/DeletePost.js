import {useEffect, useState} from "react";
import {Navigate, useParams} from "react-router-dom";
import Editor from "../Editor";

export default function EditPost() {
  const {id} = useParams();
  const [title,setTitle] = useState('');
  const [summary,setSummary] = useState('');
  const [content,setContent] = useState('');
  const [files, setFiles] = useState('');
  const [redirect,setRedirect] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:4000/post/`+id)
      .then((response) => {
        response.json().then((postInfo) => {
          setTitle(postInfo.title);
          setContent(postInfo.content);
          setSummary(postInfo.summary);
        });
      });
  }, [id]);

  async function DeletePost() {
    const { postId } = useParams(); // Use a variable name that matches your route parameter
  
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:4000/post/${postId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
  
        if (response.ok) {
          setRedirect(true);
        } else {
          // Handle the case where deletion was not successful, e.g., show an error message
          console.error("Failed to delete the post");
        }
      } catch (error) {
        // Handle any network or other errors here
        console.error("An error occurred while deleting the post", error);
      }
    }
  }
  



  return (
    <form onSubmit={DeletePost}>
      <input type="title"
             placeholder={'Title'}
             value={title}
             onChange={ev => setTitle(ev.target.value)} />
      <input type="summary"
             placeholder={'Summary'}
             value={summary}
             onChange={ev => setSummary(ev.target.value)} />
      <input type="file"
             onChange={ev => setFiles(ev.target.files)} />
      <Editor onChange={setContent} value={content} />
      <button style={{marginTop:'5px'}}>Delete post</button>
    </form>
  );
}