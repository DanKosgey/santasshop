import React, { useState } from 'react';
import { 
  FileText, Video, Type, Image as ImageIcon, Link as LinkIcon, 
  List, ListOrdered, Quote, Code, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Save, X, Eye
} from 'lucide-react';

interface ModuleContentEditorProps {
  contentType: 'text' | 'video';
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const ModuleContentEditor: React.FC<ModuleContentEditorProps> = ({
  contentType,
  content,
  onSave,
  onCancel
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);

  // Text formatting functions
  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  // Handle text content change
  const handleTextContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditorContent(e.currentTarget.innerHTML);
  };

  // Handle video URL change
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditorContent(e.target.value);
  };

  // Render text editor toolbar
  const renderTextToolbar = () => (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
      <button
        type="button"
        onClick={() => formatText('bold')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('underline')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </button>
      <div className="w-px bg-gray-600 mx-1 my-2"></div>
      <button
        type="button"
        onClick={() => formatText('formatBlock', '<h1>')}
        className="p-2 rounded hover:bg-gray-700 transition text-xs font-bold"
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => formatText('formatBlock', '<h2>')}
        className="p-2 rounded hover:bg-gray-700 transition text-xs font-bold"
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => formatText('formatBlock', '<h3>')}
        className="p-2 rounded hover:bg-gray-700 transition text-xs font-bold"
        title="Heading 3"
      >
        H3
      </button>
      <div className="w-px bg-gray-600 mx-1 my-2"></div>
      <button
        type="button"
        onClick={() => formatText('insertUnorderedList')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => formatText('insertOrderedList')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <div className="w-px bg-gray-600 mx-1 my-2"></div>
      <button
        type="button"
        onClick={() => formatText('createLink', prompt('Enter URL:') || '')}
        className="p-2 rounded hover:bg-gray-700 transition"
        title="Insert Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  );

  // Render text editor
  const renderTextEditor = () => (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {renderTextToolbar()}
      <div
        className="min-h-[400px] p-4 bg-black text-white outline-none"
        contentEditable
        onInput={handleTextContentChange}
        dangerouslySetInnerHTML={{ __html: editorContent }}
      />
    </div>
  );

  // Render video editor
  const renderVideoEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Video URL</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
              placeholder="https://www.youtube.com/embed/..."
              value={editorContent}
              onChange={handleVideoUrlChange}
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Preview</label>
        {editorContent ? (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <iframe
              src={editorContent}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Preview"
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Video className="h-12 w-12 mx-auto mb-2" />
              <p>Enter a video URL to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render content preview
  const renderPreview = () => {
    if (contentType === 'video') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Video Preview</h3>
          {editorContent ? (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={editorContent}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Preview"
              ></iframe>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p>No video URL provided</p>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Content Preview</h3>
          <div className="prose prose-invert max-w-none bg-black p-4 rounded-lg border border-gray-700">
            {editorContent ? (
              <div dangerouslySetInnerHTML={{ __html: editorContent }} />
            ) : (
              <p className="text-gray-500 italic">No content to preview</p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {contentType === 'video' ? (
            <>
              <Video className="h-5 w-5 text-blue-400" /> Video Content Editor
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 text-purple-400" /> Text Content Editor
            </>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold flex items-center gap-1 transition"
          >
            <Eye className="h-4 w-4" /> {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold flex items-center gap-1 transition"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>

      {isPreview ? (
        renderPreview()
      ) : (
        <div className="space-y-6">
          {contentType === 'text' ? renderTextEditor() : renderVideoEditor()}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editorContent)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition"
            >
              <Save className="h-4 w-4" /> Save Content
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleContentEditor;