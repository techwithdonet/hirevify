"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/src/hirevify-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/hirevify-app/components/ui/card";
import { Input } from "@/src/hirevify-app/components/ui/input";
import { Textarea } from "@/src/hirevify-app/components/ui/textarea";
import { Label } from "@/src/hirevify-app/components/ui/label";
import { Badge } from "@/src/hirevify-app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/hirevify-app/components/ui/select";

type AssessmentQuestion = {
  id?: string;
  assessment_id?: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  points: number;
  sort_order: number;
};

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
  questions?: AssessmentQuestion[];
  created_at?: string;
  updated_at?: string;
};

const emptyQuestion: AssessmentQuestion = {
  question_text: "",
  question_type: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: "",
  points: 1,
  sort_order: 0,
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
  questions: [],
};

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [form, setForm] = useState<Assessment>(emptyForm);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const filteredAssessments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return assessments;
    }

    return assessments.filter((assessment) => {
      return (
        assessment.title.toLowerCase().includes(q) ||
        assessment.description.toLowerCase().includes(q) ||
        assessment.category.toLowerCase().includes(q) ||
        assessment.level.toLowerCase().includes(q) ||
        assessment.skills.some((skill) => skill.toLowerCase().includes(q))
      );
    });
  }, [assessments, search]);

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/assessments", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load assessments.");
      setAssessments(result.assessments || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load assessments.");
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setQuestions([]);
    setSkillsText("");
    setEditingId(null);
  }

  async function startEdit(assessment: Assessment) {
    const assessmentId = assessment.id || null;

    const loadedQuestions = (assessment.questions || []).map((question, index) => ({
        id: question.id,
        assessment_id: question.assessment_id,
        question_text: question.question_text || "",
        question_type: question.question_type || "multiple_choice",
        options:
          question.options && question.options.length > 0
            ? question.options
            : ["", "", "", ""],
        correct_answer: question.correct_answer || "",
        points: Number(question.points || 1),
        sort_order: Number(question.sort_order ?? index),
      }));

    setEditingId(assessmentId);
    setForm({
      ...emptyForm,
      ...assessment,
      id: assessmentId || assessment.id,
      questions_count: loadedQuestions.length,
      duration_minutes: Number(assessment.duration_minutes || 45),
      passing_score: Number(assessment.passing_score || 70),
      skills: assessment.skills || [],
    });
    setQuestions(loadedQuestions);
    setSkillsText((assessment.skills || []).join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        ...emptyQuestion,
        options: ["", "", "", ""],
        sort_order: current.length,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateQuestion(index: number, field: keyof AssessmentQuestion, value: any) {
    setQuestions((current) =>
      current.map((question, itemIndex) => {
        if (itemIndex !== index) {
          return question;
        }

        return {
          ...question,
          [field]: value,
        };
      })
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, itemIndex) => {
        if (itemIndex !== questionIndex) {
          return question;
        }

        return {
          ...question,
          options: [...(question.options || []), ""],
        };
      })
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((current) =>
      current.map((question, itemIndex) => {
        if (itemIndex !== questionIndex) {
          return question;
        }

        const nextOptions = [...(question.options || [])];
        nextOptions[optionIndex] = value;

        return {
          ...question,
          options: nextOptions,
        };
      })
    );
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, itemIndex) => {
        if (itemIndex !== questionIndex) {
          return question;
        }

        const removedOption = question.options[optionIndex];
        const nextOptions = question.options.filter(
          (_, currentOptionIndex) => currentOptionIndex !== optionIndex
        );

        return {
          ...question,
          options: nextOptions,
          correct_answer:
            question.correct_answer === removedOption ? "" : question.correct_answer,
        };
      })
    );
  }

  function validateQuestions() {
    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];
      const validOptions = (question.options || [])
        .map((option) => option.trim())
        .filter(Boolean);

      if (!question.question_text.trim()) {
        alert(`Question ${index + 1} text is required.`);
        return false;
      }

      if (question.question_type === "multiple_choice" && validOptions.length < 2) {
        alert(`Question ${index + 1} needs at least 2 answers.`);
        return false;
      }

      if (question.question_type === "multiple_choice" && !question.correct_answer.trim()) {
        alert(`Question ${index + 1} correct answer is required.`);
        return false;
      }
    }

    return true;
  }

  async function saveAssessment() {
    if (!form.title.trim()) {
      alert("Assessment title is required.");
      return;
    }

    if (!validateQuestions()) {
      return;
    }

    setSaving(true);

    const payload = {
      id: editingId || form.id || null,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "General",
      level: form.level || "beginner",
      duration_minutes: Number(form.duration_minutes || 45),
      skills: skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      passing_score: Number(form.passing_score || 70),
      status: form.status || "active",
      questions: questions.map((question) => ({
        question_text: question.question_text.trim(),
        question_type: question.question_type || "multiple_choice",
        options: (question.options || []).map((option) => option.trim()).filter(Boolean),
        correct_answer: question.correct_answer.trim(),
        points: Number(question.points || 1),
      })),
    };

    try {
      const response = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Assessment could not be saved.");
      await loadAssessments();
      resetForm();
      alert("Assessment and questions saved.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Assessment could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment(id?: string) {
    if (!id) {
      return;
    }

    const confirmed = confirm("Delete this assessment and all its questions?");

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/assessments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(result.error || "Delete failed.");
      return;
    }
    await loadAssessments();
  }

  return (
    <div className="premium-page">
      <main className="premium-content">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/admin1" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Link>
              <h1 className="premium-title">Assessment Management</h1>
              <p className="premium-subtitle">
                Create assessments, add questions, add answer options, and choose the correct answer.
              </p>
            </div>

            <Button onClick={resetForm} className="premium-btn-accent">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>

          <Card className="premium-card">
            <CardHeader className="premium-card-header">
              <CardTitle className="premium-card-title">{editingId ? "Edit Assessment" : "Add Assessment"}</CardTitle>
            </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="premium-input" />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="premium-textarea" />
              </div>

              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="premium-input" />
              </div>

              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Duration Minutes</Label>
                <Input type="number" value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })} className="premium-input" />
              </div>

              <div>
                <Label>Passing Score %</Label>
                <Input type="number" value={form.passing_score} onChange={(event) => setForm({ ...form, passing_score: Number(event.target.value) })} className="premium-input" />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Skills comma separated</Label>
                <Input value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder="React, JavaScript, JSX" className="premium-input" />
              </div>
            </div>

            <div className="premium-panel">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
                  <p className="text-sm text-slate-500">
                    Add any number of questions. Each question can have its own answers and correct answer.
                  </p>
                </div>

                <Button type="button" onClick={addQuestion} className="premium-btn-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="premium-empty">
                  No questions added yet. Click Add Question.
                </div>
              ) : (
                <div className="space-y-5">
                  {questions.map((question, questionIndex) => {
                    const validOptions = (question.options || []).filter((option) => option.trim());

                    return (
                      <div key={questionIndex} className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Question {questionIndex + 1}</h4>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeQuestion(questionIndex)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(event) => updateQuestion(questionIndex, "question_text", event.target.value)}
                            placeholder="Enter question..."
                            rows={2}
                            className="premium-textarea"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Question Type</Label>
                            <Select value={question.question_type} onValueChange={(value) => updateQuestion(questionIndex, "question_type", value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True / False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={question.points}
                              onChange={(event) => updateQuestion(questionIndex, "points", Number(event.target.value))}
                              className="premium-input"
                            />
                          </div>

                          <div>
                            <Label>Correct Answer</Label>
                            <Select value={question.correct_answer} onValueChange={(value) => updateQuestion(questionIndex, "correct_answer", value)}>
                              <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                              <SelectContent>
                                {validOptions.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Answer Options</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addOption(questionIndex)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Answer
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(question.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                                  placeholder={`Answer ${optionIndex + 1}`}
                                  className="premium-input"
                                />
                                <Button type="button" variant="outline" onClick={() => removeOption(questionIndex, optionIndex)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {editingId && (
                <Button variant="outline" onClick={resetForm} className="premium-btn-secondary">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              )}
              <Button onClick={saveAssessment} disabled={saving} className="premium-btn-accent">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : editingId ? "Update Assessment" : "Add Assessment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="premium-card-header">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="premium-card-title">Assessments</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input className="premium-input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assessments..." />
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
                  <div key={assessment.id} className="premium-panel">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                          <Badge>{assessment.level}</Badge>
                          <Badge variant={assessment.status === "active" ? "default" : "secondary"}>{assessment.status}</Badge>
                        </div>

                        <p className="text-sm text-gray-600 max-w-3xl">{assessment.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {(assessment.skills || []).map((skill) => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                          ))}
                        </div>

                        <div className="text-sm text-gray-500">
                          {assessment.category} - {assessment.duration_minutes} min - Passing {assessment.passing_score}% - Questions {assessment.questions_count}
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
    </div>
  );
}
