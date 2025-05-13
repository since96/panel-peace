import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateRelative } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Comment {
  id: number;
  content: string;
  userId: number;
  createdAt: Date | string;
  user?: {
    name: string;
    avatarUrl?: string;
  };
}

interface CommentThreadProps {
  comments: Comment[];
  feedbackId: number;
  currentUserId: number;
  currentUserName?: string;
}

export function CommentThread({ comments, feedbackId, currentUserId, currentUserName = "You" }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { feedbackId: number; userId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/comments", commentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", feedbackId, "comments"] });
      setNewComment("");
    }
  });
  
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutateAsync({
      feedbackId,
      userId: currentUserId,
      content: newComment
    });
  };
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || "U";
  };
  
  const getUserName = (userId: number) => {
    // Sample user mapping (in a real app, you would fetch this data)
    const users: Record<number, string> = {
      1: "Alex Rodriguez",
      2: "Sarah Lee",
      3: "James King",
      4: "Mina Tan"
    };
    
    return userId === currentUserId ? currentUserName : users[userId] || "Unknown User";
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const userName = comment.user?.name || getUserName(comment.userId);
            const isCurrentUser = comment.userId === currentUserId;
            
            return (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatarUrl} alt={userName} />
                  <AvatarFallback className={isCurrentUser ? "bg-primary/10 text-primary" : ""}>
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">
                      {isCurrentUser ? "You" : userName}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {formatDateRelative(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="pt-4 border-t border-slate-200">
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(currentUserName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
