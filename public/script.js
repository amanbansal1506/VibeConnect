const socket = io();
let username = '', room = '';

socket.on('your-id', id => {
  console.log('My Socket ID:', id);
});

socket.on('room-list', rooms => {
  const roomSelect = document.getElementById('room-list');
  roomSelect.innerHTML = '';
  rooms.forEach(r => {
    const option = document.createElement('option');
    option.value = r;
    option.innerText = r;
    roomSelect.appendChild(option);
  });
});

socket.on('room-error', msg => {
  alert(msg);
});

socket.on('room-created', room => {
  alert(`Room '${room}' created successfully.`);
});

function createRoom() {
  username = document.getElementById('username').value.trim();
  const roomName = document.getElementById('new-room-name').value.trim();
  const key = document.getElementById('new-room-key').value.trim();

  if (!roomName || !key || !username) {
    alert("All fields are required.");
    return;
  }

  socket.emit('create-room', { roomName, key, username });
}

function leaveRoom() {
  socket.emit('leave-room', { username, room });
  
  document.getElementById('messages').innerHTML = '';
  document.getElementById('room-title').innerText = '';
  
  document.getElementById('chat').style.display = 'none';
  document.getElementById('login').style.display = 'block';
}

function joinRoom() {
  username = document.getElementById('username').value.trim();
  const roomName = document.getElementById('room-list').value;
  const key = document.getElementById('room-key').value.trim();

  if (!username || !roomName || !key) {
    alert("Please enter username, select room, and enter key.");
    return;
  }

  room= roomName;
  socket.emit('join-room', { username, roomName, key });

  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  document.getElementById('room-title').innerText = `Room Name: ${room}`;
}

function sendMessage() {
  const input = document.getElementById('message-input');
  const msg = input.value.trim();
  if (msg) {
    socket.emit('send-message', formatText(msg));
    input.value = '';
  }
}

socket.on('chat-message', data => {
  const msgBox = document.getElementById('messages');
  msgBox.innerHTML += `
    <div class="chat-message"><strong>${data.user}</strong> [${data.time}]: ${data.text}</div>`;
  msgBox.scrollTop = msgBox.scrollHeight;
});

socket.on('user-joined', msg => {
  document.getElementById('messages').innerHTML += `<em>${msg}</em><br>`;
});

socket.on('user-left', msg => {
  document.getElementById('messages').innerHTML += `<em>${msg}</em><br>`;
});

function formatText(text) {
  return text
    .replace(/\*(.*?)\*/g, '<b>$1</b>')
    .replace(/_(.*?)_/g, '<i>$1</i>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
}
