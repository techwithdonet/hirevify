"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Save, Search, Trash2, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase";
import { Button } from "@/src/hirevify-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/hirevify-app/components/ui/card";
import { Input } from "@/src/hirevify-app/components/ui/input";
import { Textarea } from "@/src/hirevify-app/components/ui/textarea";
import { Label } from "@/src/hirevify-app/components/ui/label";
import { Badge } from "@/src/hirevify-app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/hirevify-app/components/ui/select";

type Assessment = {
  id?: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration_minutes: number;
  skills: string[];
  questions_count: number;
  passing_score: number;
  status: string;
};

const emptyForm: Assessment = {
  title: "",
  description: "",
  category: "General",
  level: "beginner",
  duration_minutes: 45,
  skills: [],
  questions_count: 0,
  passing_score: 70,
  status: "active",
};

export default function AdminAssessmentsPage() {
  const supabase = createSupabaseBrowserClient();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [form, setForm] = useState<Assessment>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const filteredAssessments = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return assessments;

    return assessments.filter((assessment) => {
      return (
        assessment.title?.toLowerCase().includes(q) ||
        assessment.description?.toLowerCase().includes(q) ||
        assessment.category?.toLowerCase().includes(q) ||
        assessment.level?.toLowerCase().includes(q) ||
        assessment.skills?.some((skill) => skill.toLowerCase().includes(q))
      );
    });
  }, [assessments, search]);

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("skills_assessments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Failed to load assessments: " + error.message);
      setAssessments([]);
      setLoading(false);
      return;
    }

    setAssessments((data || []) as Assessment[]);
    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setSkillsText("");
    setEditingId(null);
  }

  function startEdit(assessment: Assessment) {
    setEditingId(assessment.id || null);
    setForm({
      ...emptyForm,
      ...assessment,
      skills: assessment.skills || [],
      duration_minutes: Number(assessment.duration_minutes || 45),
      questions_count: Number(assessment.questions_count || 0),
      passing_score: Number(assessment.passing_score || 70),
    });
    setSkillsText((assessment.skills || []).join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAssessment() {
    if (!form.title.trim()) {
      alert("Assessment title is required.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "General",
      level: form.level,
      duration_minutes: Number(form.duration_minutes || 45),
      skills: skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      questions_count: Number(form.questions_count || 0),
      passing_score: Number(form.passing_score || 70),
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("skills_assessments").update(payload).eq("id", editingId)
      : await supabase.from("skills_assessments").insert(payload);

    if (result.error) {
      alert("Save failed: " + result.error.message);
      setSaving(false);
      return;
    }

    await loadAssessments();
    resetForm();
    setSaving(false);
  }

  async function deleteAssessment(id?: string) {
    if (!id) return;

    const confirmed = confirm("Delete this assessment?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("skills_assessments")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }

    await loadAssessments();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin1" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
            <p className="text-gray-600">View, add, edit, and delete candidate skill assessments.</p>
          </div>

          <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Assessment" : "Add Assessment"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="React Development Skills"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Assessment description..."
                rows={3}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Frontend"
              />
            </div>

            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration Minutes</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })}
              />
            </div>

            <div>
              <Label>Passing Score %</Label>
              <Input
                type="number"
                value={form.passing_score}
                onChange={(event) => setForm({ ...form, passing_score: Number(event.target.value) })}
              />
            </div>

            <div>
              <Label>Questions Count</Label>
              <Input
                type="number"
                value={form.questions_count}
                onChange={(event) => setForm({ ...form, questions_count: Number(event.target.value) })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Skills comma separated</Label>
              <Input
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="React, JavaScript, JSX, Hooks"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              )}
              <Button onClick={saveAssessment} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : editingId ? "Update Assessment" : "Add Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Assessments</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search assessments..."
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading assessments...</p>
            ) : filteredAssessments.length === 0 ? (
              <p className="text-gray-500">No assessments found.</p>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => (
                  <div key={assessment.id} className="rounded-xl border bg-white p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                          <Badge>{assessment.level}</Badge>
                          <Badge variant={assessment.status === "active" ? "default" : "secondary"}>
                            {assessment.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 max-w-3xl">{assessment.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {(assessment.skills || []).map((skill) => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                          ))}
                        </div>

                        <div className="text-sm text-gray-500">
                          {assessment.category} • {assessment.duration_minutes} min • Passing {assessment.passing_score}% • Questions {assessment.questions_count || "Multiple"}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => startEdit(assessment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => deleteAssessment(assessment.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
