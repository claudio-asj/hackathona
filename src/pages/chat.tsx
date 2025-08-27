import Chatbot from "../components/chat/Chatbot";

function ChatPage() {
    return (
        <div className="flex flex-col h-screen">
            <header className="bg-primary p-4 text-white">
                <h1 className="text-xl font-bold">AI Vector</h1>
            </header>

            <main className="flex-1 container mx-auto p-4 max-w-4xl">
                
                
                <div className="bg-card rounded-lg shadow-lg h-full border border-border mt-4">
                    <Chatbot />
                </div>
            </main>
        </div>
    );
}

export default ChatPage;