import React, { Component } from "react";
const BrowserSpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    window.mozSpeechRecognition ||
    window.msSpeechRecognition ||
    window.oSpeechRecognition);
const recognition = BrowserSpeechRecognition
  ? new BrowserSpeechRecognition()
  : null;
let listening = true;

recognition.start();

let pauseAfterDisconnect = false;
let interimTranscript = "";
let finalTranscript = "";

export class Myspeech extends Component {
  constructor(props) {
    super(props);

    this.state = {
      interimTranscript,
      finalTranscript,
      listening: true,
      answer: "",
      todos: ["clean room", "buy groceries"],
      situation: "",
      nowlistening: true
    };
    this.speaker = new SpeechSynthesisUtterance();
    this.speaker.lang = "en-US";
  }

  componentWillMount() {
    
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = this.updateTranscript.bind(this);
      recognition.onend = this.onRecognitionDisconnect.bind(this);
      this.setState({ listening });
    }
  }

  disconnect = disconnectType => {
    if (recognition) {
      switch (disconnectType) {
        case "ABORT":
          pauseAfterDisconnect = true;
          recognition.abort();
          break;
        case "RESET":
          pauseAfterDisconnect = false;
          recognition.abort();
          break;
        case "STOP":
        default:
          pauseAfterDisconnect = true;
          recognition.stop();
      }
    }
  };

  onRecognitionDisconnect() {
    listening = false;
    if (pauseAfterDisconnect) {
      this.setState({ listening });
    } else {
      this.startListening();
    }
    pauseAfterDisconnect = false;
  }
  resetTranscript = () => {
    interimTranscript = "";
    finalTranscript = "";
    this.disconnect("RESET");
    this.setState({ interimTranscript, finalTranscript });
  };
  answerToUser(arg) {
    var todos = this.state.todos;
    if (this.state.situation === "addingNewTodo") {
      todos.push(arg);
      this.setState({
        todos,
        situation: "",
        answer: "I added your new to do succesfully"
      });
    } else if (this.state.situation === "deletingTodo") {
      var index;
      this.state.todos.map((todo,key)=>{
        if(todo.replace(/^ /,'') === (arg.replace(/^ /,''))){
          index= key;                 
        }
        return null;
      })
      if(index >=0){
        todos.splice(index,1);
        this.setState({
          todos,
          situation: "",
          answer: "I deleted that to do succesfully."
        });
      }else{
        this.setState({
          situation: "deletingTodo",
          answer: "I didn't understand, can you repeat it please?"
        });
      }
    } else {
      if (arg.includes("hello") && !arg.includes("add")) {
        this.setState({ answer: "Hello, I am here to help you!" });
      } else if (arg.includes("bye")) {
        this.setState({ answer: "Bye, I am always here to help you!" });
        window.open("https://www.youtube.com/watch?v=LRyrWN-fftE", "_blank");
      } else if (arg.includes("thank")) {
        this.setState({ answer: "You are welcome, don't mention it." });
      } else if (
        (arg.includes("add") || arg.includes("new")) &&
        (arg.includes("to do")||arg.includes('one'))
      ) {
        this.setState({
          answer: "Sure, tell me what do you want to add?",
          situation: "addingNewTodo"
        });
      } else if (arg.includes("ok") || arg.includes("stop")) {
        this.setState({
          answer: "Okay.."
        });
      } else if (
        arg.includes("delete") ||
        (arg.includes("remove") && arg.includes("to do"))
      ) {
        this.setState({
          answer: "Sure, tell me which one do you want to delete?",
          situation: "deletingTodo"
        });
      } else {
        this.setState({
          answer:
            "Sorry, I didn't understand you. I have no if statement for your request. I am not human, I am a robot. Can you be more spesific please!"
        });
      }
    }

    this.speaker.text = this.state.answer;
    speechSynthesis.speak(this.speaker);
  }
  updateTranscript(event) {
    interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript = event.results[i][0].transcript;
        this.answerToUser(finalTranscript);
        this.setState({ finalTranscript, nowlistening: false });
      } else {
        speechSynthesis.cancel();
        interimTranscript = this.concatTranscripts(
          interimTranscript,
          event.results[i][0].transcript
        );
        this.setState({ interimTranscript, nowlistening: true });
      }
    }
    // this.setState({ finalTranscript, interimTranscript });
  }
  concatTranscripts(...transcriptParts) {
    return transcriptParts
      .map(t => t.trim())
      .join(" ")
      .trim();
  }
  startListening = () => {
    if (recognition && !listening) {
      try {
        recognition.start();
      } catch (DOMException) {
        // Tried to start recognition after it has already started - safe to swallow this error
      }
      listening = true;
      this.setState({ listening });
    }
  };
  abortListening = () => {
    listening = false;
    this.setState({ listening });
    this.disconnect("ABORT");
  };

  stopListening = () => {
    listening = false;
    this.setState({ listening });
    this.disconnect("STOP");
  };

  render() {
    var transcript = "";
    transcript += interimTranscript;
    return (
      <div>
        <div className="voiceStuffs">
          <p>{transcript}</p>
          <p className="answer">{this.state.answer}</p>
          {this.state.nowlistening && <p>Listening..</p>}
        </div>

        <div id="container">
          <header>
            <h1>Task List</h1>
          </header>
          <section id="taskIOSection">
            <div id="formContainer">
              <form id="taskEntryForm">
                <input
                  id="taskInput"
                  disabled
                  placeholder="What would you like to do today? Speak to add new todo!"
                />
              </form>
            </div>
            <ul id="taskList">
              {this.state.todos.map((todo, key) => {
                return (
                  <li key={key}>
                     {todo}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    );
  }
}

export default Myspeech;
