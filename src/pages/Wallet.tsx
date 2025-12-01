import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownLeft, Gift, Clock, CheckCircle, Calendar, Play, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const rewards = [
  { id: 1, title: 'Daily Login - Day 7', reward: 20, icon: Calendar, completed: false, available: true },
  { id: 2, title: 'Complete a Meditation', reward: 5, icon: Play, completed: true, available: false },
  { id: 3, title: '7-Day Streak Bonus', reward: 50, icon: CheckCircle, completed: false, available: true },
  { id: 4, title: 'Invite a Friend', reward: 100, icon: Users, completed: false, available: true },
  { id: 5, title: 'Go Premium', reward: 2000, icon: Crown, completed: false, available: true },
];

const transactions = [
  { id: 1, type: 'earned', title: 'Daily Login Reward', amount: 7, time: '2 hours ago' },
  { id: 2, type: 'earned', title: 'Meditation Completed', amount: 5, time: '1 day ago' },
  { id: 3, type: 'spent', title: 'Course Unlock', amount: -300, time: '3 days ago' },
  { id: 4, type: 'earned', title: 'Weekly Streak', amount: 50, time: '5 days ago' },
  { id: 5, type: 'earned', title: 'Referral Bonus', amount: 100, time: '1 week ago' },
];

const Wallet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

  return (
    <div className="min-h-screen px-4 pt-6">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground">SHC Wallet</h1>
        <p className="text-muted-foreground mt-1">Earn and manage your tokens</p>
      </header>

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-spiritual p-6 mb-6 animate-slide-up">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <p className="text-foreground/70 text-sm mb-1">Total Balance</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-heading font-bold text-foreground">1,250</span>
            <span className="text-xl text-accent font-medium">SHC</span>
          </div>

          <div className="flex gap-3">
            <Button variant="glass" size="sm" className="flex-1">
              <ArrowUpRight size={16} />
              Send
            </Button>
            <Button variant="glass" size="sm" className="flex-1">
              <ArrowDownLeft size={16} />
              Receive
            </Button>
            <Button variant="gold" size="sm" className="flex-1">
              <Gift size={16} />
              Claim
            </Button>
          </div>
        </div>
      </div>

      {/* Streak info */}
      <div className="flex gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-primary">7</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-secondary">23</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-4 border border-border/30 text-center">
          <p className="text-2xl font-heading font-bold text-accent">850</p>
          <p className="text-xs text-muted-foreground">Earned</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'rewards'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          Rewards
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground'
          }`}
        >
          History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rewards' ? (
        <div className="space-y-3 animate-fade-in">
          {rewards.map((reward, index) => (
            <div
              key={reward.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                reward.completed
                  ? 'bg-secondary/10 border-secondary/30'
                  : 'bg-gradient-card border-border/50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                reward.completed ? 'bg-secondary/20' : 'bg-primary/20'
              }`}>
                {reward.completed ? (
                  <CheckCircle className="text-secondary" size={22} />
                ) : (
                  <reward.icon className="text-primary" size={22} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${reward.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {reward.title}
                </p>
                <p className="text-sm text-accent flex items-center gap-1">
                  <Sparkles size={12} />
                  +{reward.reward} SHC
                </p>
              </div>
              {!reward.completed && reward.available && (
                <Button variant="spiritual" size="sm">
                  Claim
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-card border border-border/50"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'earned' ? 'bg-secondary/20' : 'bg-destructive/20'
              }`}>
                {tx.type === 'earned' ? (
                  <ArrowDownLeft className="text-secondary" size={18} />
                ) : (
                  <ArrowUpRight className="text-destructive" size={18} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{tx.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {tx.time}
                </p>
              </div>
              <span className={`font-heading font-semibold ${
                tx.amount > 0 ? 'text-secondary' : 'text-destructive'
              }`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} SHC
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wallet;
