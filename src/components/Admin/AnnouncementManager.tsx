
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Megaphone, Send, Trash2, Users } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
  user_count?: number;
}

export function AnnouncementManager() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setAnnouncements([]);
    setLoading(false);
  };

  const sendAnnouncement = async () => {
    if (!user || !title.trim() || !message.trim()) return;

    setIsSending(true);
    toast({
      title: 'Not implemented',
      description: 'Announcements are not available in this build',
      variant: 'destructive',
    });
    setIsSending(false);
  };

  const deleteAnnouncement = async (id: string) => {
    toast({
      title: 'Not implemented',
      description: 'Delete announcement disabled',
      variant: 'destructive',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send New Announcement */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Megaphone className="w-5 h-5" />
            Send New Announcement
          </CardTitle>
          <CardDescription>
            Send a notification to all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <Textarea
              placeholder="Announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
            />
          </div>
          <Button
            onClick={sendAnnouncement}
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to All Users
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Announcements History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Announcements History ({announcements.length})
          </CardTitle>
          <CardDescription>
            All previously sent announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{announcement.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        <Users className="w-3 h-3 mr-1" />
                        {announcement.user_count || 0} users
                      </Badge>
                      <Button
                        onClick={() => deleteAnnouncement(announcement.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    Sent: {new Date(announcement.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No announcements sent yet
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
