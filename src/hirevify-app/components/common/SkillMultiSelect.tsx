import { X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MAX_SKILLS_PER_FORM, SKILL_OPTIONS } from '../../constants/skills';

export function SkillMultiSelect({
 value,
 onChange,
 max = MAX_SKILLS_PER_FORM,
 placeholder = 'Add skill',
}: {
 value: string[];
 onChange: (skills: string[]) => void;
 max?: number;
 placeholder?: string;
}) {
 const normalized = value.map((skill) => skill.trim()).filter(Boolean);
 const availableSkills = SKILL_OPTIONS.filter((skill) => !normalized.includes(skill));
 const atLimit = normalized.length >= max;

 const addSkill = (skill: string) => {
 if (!skill || normalized.includes(skill) || atLimit) return;
 onChange([...normalized, skill]);
 };

 const removeSkill = (skill: string) => {
 onChange(normalized.filter((item) => item !== skill));
 };

 return (
 <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
 <div className="flex flex-wrap gap-2">
 {normalized.length > 0 ? (
 normalized.map((skill) => (
 <Badge key={skill} variant="secondary" className="gap-1 bg-emerald-50 text-emerald-800">
 {skill}
 <button type="button" onClick={() => removeSkill(skill)} className="rounded-full hover:bg-emerald-100">
 <X className="h-3 w-3" />
 </button>
 </Badge>
 ))
 ) : (
 <p className="text-sm text-slate-500">No skills selected yet.</p>
 )}
 </div>
 <Select onValueChange={addSkill} disabled={atLimit}>
 <SelectTrigger className="bg-slate-50">
 <SelectValue placeholder={atLimit ? `Maximum ${max} skills selected` : placeholder} />
 </SelectTrigger>
 <SelectContent>
 {availableSkills.map((skill) => (
 <SelectItem key={skill} value={skill}>
 {skill}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <p className="text-xs text-slate-500">
 {normalized.length}/{max} skills selected. Use the most important skills so filters and ATS matching stay accurate.
 </p>
 </div>
 );
}
