import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { X, Plus } from 'lucide-react';
import { NewPortfolioItem, PortfolioItem } from './types';

interface AddPortfolioFormProps {
 onAdd: (item: NewPortfolioItem) => void | Promise<void>;
 onCancel: () => void;
 mode?: 'add' | 'edit';
 initialItem?: PortfolioItem | null;
}

export function AddPortfolioForm({
 onAdd,
 onCancel,
 mode = 'add',
 initialItem = null,
}: AddPortfolioFormProps) {
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [url, setUrl] = useState('');
 const [tagInput, setTagInput] = useState('');
 const [tags, setTags] = useState<string[]>([]);

 const isEditMode = mode === 'edit';

 useEffect(() => {
 if (!initialItem) return;

 setTitle(initialItem.title || '');
 setDescription(initialItem.description || '');
 setUrl(
 (initialItem as any).url ||
 (initialItem as any).projectUrl ||
 (initialItem as any).project_url ||
 ''
 );
 setTags(
 (initialItem as any).tags ||
 (initialItem as any).technologies ||
 (initialItem as any).skills ||
 []
 );
 }, [initialItem]);

 const handleAddTag = () => {
 const value = tagInput.trim();

 if (!value) return;
 if (tags.includes(value)) {
 setTagInput('');
 return;
 }

 setTags((prev) => [...prev, value]);
 setTagInput('');
 };

 const handleRemoveTag = (tag: string) => {
 setTags((prev) => prev.filter((item) => item!== tag));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!title.trim()) return;
 if (!description.trim()) return;

 await onAdd({
 title: title.trim(),
 description: description.trim(),
 url: url.trim(),
 tags,
 technologies: tags,
 } as NewPortfolioItem);
 };

 return (
 <Card className="border border-border">
 <CardHeader>
 <CardTitle>
 {isEditMode? 'Edit Project': 'Add New Project'}
 </CardTitle>
 </CardHeader>

 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <Input
 placeholder="Project title"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>

 <div>
 <Textarea
 placeholder="Project description"
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={4}
 />
 </div>

 <div>
 <Input
 placeholder="Project URL"
 value={url}
 onChange={(e) => setUrl(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <div className="flex gap-2">
 <Input
 placeholder="Add skill or technology"
 value={tagInput}
 onChange={(e) => setTagInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleAddTag();
 }
 }}
 />

 <Button type="button" variant="outline" onClick={handleAddTag}>
 <Plus className="w-4 h-4" />
 </Button>
 </div>

 {tags.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {tags.map((tag) => (
 <Badge key={tag} variant="secondary" className="flex items-center gap-1">
 {tag}
 <button
 type="button"
 onClick={() => handleRemoveTag(tag)}
 className="ml-1"
 >
 <X className="w-3 h-3" />
 </button>
 </Badge>
 ))}
 </div>
 )}
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={onCancel}>
 Cancel
 </Button>

 <Button type="submit">
 {isEditMode? 'Update Project': 'Add Project'}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 );
}

