import { useAuth } from '../services/AuthContext';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { uploadToCloudinary } from '../services/cloudinary';

export default function PerfilPage() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/avatar-default.png');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!newAvatar) return;
    const url = await uploadToCloudinary(newAvatar, 'image');
    setAvatarUrl(url);
  };

  if (!user) return null;

  return (
    <div className="bg-zinc-900 text-white min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-20">
        <div className="flex items-center space-x-4">
          <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
          <div>
            <h2 className="text-xl font-bold">{user.displayName || user.email}</h2>
            <p className="text-sm text-zinc-400">{bio || 'Sem biografia'}</p>
          </div>
        </div>

        <div className="mt-6">
          <input type="file" onChange={(e) => setNewAvatar(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} className="bg-yellow-500 px-4 py-2 rounded text-black mt-2">
            Alterar Avatar
          </button>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-2">Postagens</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Aqui vão os posts */}
            <div className="bg-zinc-800 h-40 rounded flex items-center justify-center text-zinc-400">Sem posts</div>
          </div>
        </div>
      </main>
    </div>
  );
}
