Code Collab

A real-time collaborative code editing platform that makes coding together effortless. Write, execute, and share code with your team - all in one place.

## 🚀 Features

### Real-time Collaboration
- **Live Editing:** Multiple users can edit code simultaneously with real-time synchronization
- **Active Users Tracking:** See who's currently working in your collaboration space
- **User Join/Leave Notifications:** Get notified when team members join or leave

### Code Editor
- **Multi-Language Support:** JavaScript, Python, C, Rust, and Java
- **Syntax Highlighting:** Professional code editor with proper syntax highlighting
- **Code Execution:** Run your code directly in the browser and see the output

### Collaboration Management
- **Space Creation:** Create named collaboration spaces for different projects
- **Shareable Links:** Generate and share links to invite others to your collaboration space
- **Space Renaming:** Rename your collaboration spaces with real-time updates for all users

### Utility Features
- **Auto-Save:** Automatic code saving to prevent losing work
- **Download Code:** Export your code with proper file extensions
- **User Authentication:** Secure login and registration system
- **Dashboard:** Manage all your collaboration spaces in one place

## 🛠️ Technologies Used

### Frontend
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code's editor)
- [Recoil](https://recoiljs.org/) (State Management)
- [Shadcn UI](https://ui.shadcn.com/) (Component Library)

### Backend
- [Express.js](https://expressjs.com/)
- [Socket.io](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)
- [Node.js](https://nodejs.org/)
- [JWT Authentication](https://jwt.io/)

## 💻 Usage

### Creating a Collaboration Space
1. Sign up or log in to your account
2. Click "Create Collab Space" from the dashboard
3. Enter your name and the space name
4. Share the generated link with collaborators

### Joining a Collaboration Space
1. Click on a shared collaboration link
2. Enter your name to join
3. Start collaborating in real-time

### Using the Editor
- Select a programming language from the dropdown
- Write or edit code in the editor
- Run your code by clicking the "Run" button
- View the output in the terminal below
- Save your work with the "Save" button
- Download your code using the "Download" button

### Managing Spaces
- Rename spaces by clicking on the rename icon
- Leave a space by clicking "Leave CollabSpace"
- Return to your dashboard to see all your spaces

## 🔄 Project Structure

```
Code-Collab-main/
│
├── app/                    # Main application code
│   ├── auth/               # Authentication pages
│   ├── collab/             # Collaboration features
│   │   ├── create/         # Create collaboration space
│   │   ├── join/           # Join collaboration space
│   │   └── space/          # Collaboration space components
│   ├── dashboard/          # User dashboard
│   └── states/             # Recoil state definitions
│
├── components/             # Reusable UI components
│   ├── custom/             # Custom components
│   ├── ui/                 # Shadcn UI components
│   └── RenameDialog.tsx    # Dialog for renaming spaces
│
├── public/                 # Static assets
├── styles/                 # Global styles
└── hooks/                  # Custom React hooks
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👏 Acknowledgments

- [Monaco Editor](https://github.com/microsoft/monaco-editor) for the code editing experience
- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn UI](https://ui.shadcn.com/) for beautiful UI components
- [Piston API](https://github.com/engineer-man/piston) for code execution
- All open-source packages that made this project possible

---

Built with ❤️ by [Vishal Raj](https://github.com/vishalraj096)
