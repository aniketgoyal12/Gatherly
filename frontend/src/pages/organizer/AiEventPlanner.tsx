import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowRight,
  RefreshCw,
  Layers,
  FileCheck,
  Building,
  Target,
  ListTodo,
  ShieldAlert,
  CalendarPlus,
} from 'lucide-react';

interface TimelineItem {
  time: string;
  activity: string;
}

interface StaffNeed {
  role: string;
  count: number;
}

interface BudgetSplit {
  venue: number;
  catering: number;
  avAndTech: number;
  contingency: number;
}

interface GeneratedPlan {
  checklist: string[];
  timeline: TimelineItem[];
  staffNeeds: StaffNeed[];
  budgetSplit: BudgetSplit;
  riskAssessment: string;
}

interface AiResponseData {
  planType: string;
  inputs: Record<string, unknown>;
  generatedPlan: GeneratedPlan;
  note?: string;
}

export const AiEventPlanner: React.FC = () => {
  const navigate = useNavigate();

  // Planner Input Form State
  const [eventType, setEventType] = useState('Tech Conference & Hackathon');
  const [targetAudience, setTargetAudience] = useState('Developers, Tech Founders & Students');
  const [attendees, setAttendees] = useState<number>(250);
  const [budget, setBudget] = useState<number>(75000);
  const [durationDays, setDurationDays] = useState<number>(2);
  const [location, setLocation] = useState('Bengaluru Innovation Center');
  const [goals, setGoals] = useState('Showcase AI integrations, foster networking, and conduct hands-on developer workshops.');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiResponseData | null>(null);

  // Approval State
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Completed Checklist Items (interactive tracking)
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  // Fetch organizer events for optional link
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        const res = await apiClient.get('/events', { params: { limit: 20 } });
        const list: Event[] = res.data?.data?.events || [];
        setEvents(list);
      } catch (e) {
        console.warn('Could not load events list for association', e);
      }
    };
    fetchOrganizerEvents();
  }, []);

  // Call POST /ai/generate-plan
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);
    setApprovalSuccess(null);
    setApprovalError(null);

    try {
      const payload = {
        eventType,
        targetAudience,
        attendees: Number(attendees),
        budget: Number(budget),
        durationDays: Number(durationDays),
        duration: `${durationDays} Days`,
        location,
        goals,
      };

      const res = await apiClient.post('/ai/generate-plan', payload);
      const data: AiResponseData = res.data?.data;
      setAiResult(data);
      setCheckedTasks({});
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setGenerateError(e.response?.data?.message || 'Failed to generate AI blueprint. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Call POST /ai/approve-plan
  const handleApprovePlan = async () => {
    if (!aiResult) return;
    setIsApproving(true);
    setApprovalSuccess(null);
    setApprovalError(null);

    try {
      const payload = {
        eventId: selectedEventId || null,
        planType: aiResult.planType || 'event_blueprint',
        inputs: aiResult.inputs,
        generatedPlan: aiResult.generatedPlan,
        applyBudget: true,
      };

      await apiClient.post('/ai/approve-plan', payload);
      setApprovalSuccess(
        selectedEventId
          ? 'AI Blueprint approved and attached to the selected event with budget allocations seeded!'
          : 'AI Blueprint approved and saved to your master event archive!'
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApprovalError(e.response?.data?.message || 'Failed to approve AI blueprint.');
    } finally {
      setIsApproving(false);
    }
  };

  // Toggle checklist checkbox
  const toggleTask = (index: number) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Calculate budget breakdown totals
  const budgetSplit = aiResult?.generatedPlan?.budgetSplit || {
    venue: 0,
    catering: 0,
    avAndTech: 0,
    contingency: 0,
  };
  const totalAllocated = Object.values(budgetSplit).reduce((a, b) => a + b, 0) || budget || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-50 border border-coral-200 text-coral-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>FastAPI AI Blueprint Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            AI Event Blueprint Studio
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Generate complete day-wise itineraries, itemized budget splits, staffing needs, and risk models in seconds.
          </p>
        </div>

        <Link to="/organizer/dashboard">
          <Button variant="outline" size="sm">
            Organizer Hub
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="cream" className="p-6 border border-cream-300 shadow-sm">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-coral-500" />
                <span>Configure Event Parameters</span>
              </CardTitle>
              <CardDescription>
                Provide key requirements to prompt the AI architecture service.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleGeneratePlan} className="space-y-4 pt-2">
              {generateError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {generateError}
                </div>
              )}

              {/* Event Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Event Format / Title
                </label>
                <Input
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g. Full-Stack Developer Hackathon"
                  required
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Target Audience
                </label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. University Students, Engineers"
                  required
                />
              </div>

              {/* Attendees & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Attendees
                  </label>
                  <Input
                    type="number"
                    min={10}
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    leftIcon={<Users className="w-3.5 h-3.5 text-navy-400" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Duration (Days)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={14}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    leftIcon={<Clock className="w-3.5 h-3.5 text-navy-400" />}
                    required
                  />
                </div>
              </div>

              {/* Budget & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Budget (₹)
                  </label>
                  <Input
                    type="number"
                    min={1000}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    leftIcon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Koramangala or Online"
                  />
                </div>
              </div>

              {/* Key Goals */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                  Primary Goals & Tone
                </label>
                <textarea
                  rows={3}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Outline key objectives, sponsor expectations, or workshops..."
                  className="w-full text-xs p-3 bg-cream-50 border border-cream-300 rounded-xl text-navy-950 placeholder-navy-400 focus:outline-none focus:border-coral-500"
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isGenerating}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full shadow-md"
              >
                Generate Blueprint with AI
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Output: Interactive Plan Blueprint (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!aiResult && !isGenerating ? (
            <Card variant="subtle" className="p-12 text-center space-y-4 border-dashed border-2 border-cream-300">
              <div className="w-14 h-14 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-navy-950">AI Studio Ready</h3>
                <p className="text-xs text-navy-600 leading-relaxed">
                  Enter your expected attendance volume, budget, and event format on the left to generate an itemized execution blueprint.
                </p>
              </div>
            </Card>
          ) : isGenerating ? (
            <Card variant="cream" className="p-12 text-center space-y-4 border border-cream-300">
              <div className="w-12 h-12 border-3 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-navy-950">Synthesizing Blueprint...</h3>
                <p className="text-xs text-navy-600">
                  Calculating staffing ratios, budget allocations, and day-wise schedule milestones.
                </p>
              </div>
            </Card>
          ) : aiResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Approval Success Alert */}
              {approvalSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{approvalSuccess}</span>
                  </div>
                  <Link to="/organizer/budget">
                    <span className="underline hover:text-emerald-950 cursor-pointer">
                      View Budget Tracker →
                    </span>
                  </Link>
                </div>
              )}

              {approvalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {approvalError}
                </div>
              )}

              {/* Blueprint Summary Card */}
              <Card variant="navy" className="p-6 text-cream-50 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="coral" size="sm">
                    AI Generated Blueprint
                  </Badge>
                  <span className="text-xs text-cream-300 font-mono">
                    {durationDays} Days · {attendees} Guests
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{eventType}</h2>
                  <p className="text-xs text-cream-300 mt-1">Target: {targetAudience}</p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-navy-800">
                  <div>
                    <span className="text-[10px] text-cream-400 font-bold uppercase tracking-wider block">
                      Total Budget
                    </span>
                    <span className="text-base font-black text-emerald-400">
                      ₹{budget.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cream-400 font-bold uppercase tracking-wider block">
                      Target Turnout
                    </span>
                    <span className="text-base font-black text-coral-400">{attendees} Pax</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-cream-400 font-bold uppercase tracking-wider block">
                      Location
                    </span>
                    <span className="text-xs font-semibold text-white truncate block">{location}</span>
                  </div>
                </div>
              </Card>

              {/* 1. Itemized Budget Allocation Breakdown */}
              <Card variant="cream" className="p-6 border border-cream-300 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Itemized Budget Allocation Split</span>
                  </h3>
                  <Badge variant="success" size="sm">
                    100% Allocated
                  </Badge>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { key: 'venue', label: 'Venue & Facilities (40%)', amt: budgetSplit.venue, color: 'bg-navy-900' },
                    { key: 'catering', label: 'Catering & Refreshments (30%)', amt: budgetSplit.catering, color: 'bg-coral-500' },
                    { key: 'avAndTech', label: 'AV, Tech & Streaming (20%)', amt: budgetSplit.avAndTech, color: 'bg-emerald-600' },
                    { key: 'contingency', label: 'Contingency & Buffer (10%)', amt: budgetSplit.contingency, color: 'bg-amber-500' },
                  ].map((cat) => {
                    const pct = Math.round((cat.amt / totalAllocated) * 100);
                    return (
                      <div key={cat.key} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-navy-800">
                          <span>{cat.label}</span>
                          <span className="font-bold">₹{cat.amt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                          <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 2. Timeline Milestones */}
              <Card variant="cream" className="p-6 border border-cream-300 space-y-4">
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-coral-500" />
                  <span>Timeline Milestones & Agenda</span>
                </h3>

                <div className="space-y-2.5">
                  {aiResult.generatedPlan.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-cream-100 border border-cream-200 text-xs"
                    >
                      <div className="px-2.5 py-1 rounded-lg bg-navy-950 text-cream-100 font-mono font-bold text-[11px] shrink-0">
                        {item.time}
                      </div>
                      <div className="font-semibold text-navy-900 pt-0.5">{item.activity}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 3. Operational Staffing Recommendations */}
              <Card variant="cream" className="p-6 border border-cream-300 space-y-4">
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <Users className="w-4 h-4 text-navy-700" />
                  <span>Recommended Gate & Operations Staffing</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiResult.generatedPlan.staffNeeds.map((need, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-cream-100 border border-cream-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-navy-950">{need.role}</span>
                      <Badge variant="navy" size="sm">
                        {need.count} Staff Required
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 4. Action Checklist */}
              <Card variant="cream" className="p-6 border border-cream-300 space-y-4">
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-coral-600" />
                  <span>Pre-Event Execution Checklist</span>
                </h3>

                <div className="space-y-2">
                  {aiResult.generatedPlan.checklist.map((task, idx) => {
                    const isChecked = !!checkedTasks[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTask(idx)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through'
                            : 'bg-cream-100 border-cream-200 text-navy-900 hover:bg-cream-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-navy-400 bg-cream-50'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-semibold">{task}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 5. Risk Assessment */}
              {aiResult.generatedPlan.riskAssessment && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>AI Risk Assessment & Operational Surge Warning</span>
                  </div>
                  <p className="leading-relaxed pl-6">{aiResult.generatedPlan.riskAssessment}</p>
                </div>
              )}

              {/* Approval & Action Bar */}
              <Card variant="cream" className="p-5 border border-cream-300 space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                    Link Blueprint to an Existing Event (Optional)
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl bg-cream-100 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                  >
                    <option value="">-- Save as Master Standalone Blueprint --</option>
                    {events.map((ev) => {
                      const eid = ev._id || ev.id || '';
                      return (
                        <option key={eid} value={eid}>
                          {ev.title} ({ev.status})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApprovePlan}
                    disabled={isApproving}
                    isLoading={isApproving}
                    leftIcon={<FileCheck className="w-4 h-4" />}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    Approve & Save Plan
                  </Button>

                  <Button
                    variant="navy"
                    size="md"
                    onClick={() => {
                      navigate('/organizer/create-event', {
                        state: {
                          title: eventType,
                          category: 'Technology',
                          capacity: attendees,
                          description: `${goals}\n\nKey Milestones:\n${aiResult.generatedPlan.timeline
                            .map((t) => `${t.time} - ${t.activity}`)
                            .join('\n')}`,
                          budget,
                        },
                      });
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Launch Event from Blueprint
                  </Button>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AiEventPlanner;
