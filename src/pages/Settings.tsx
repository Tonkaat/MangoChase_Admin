import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Globe,
  Shield,
  Database,
  Palette,
  Mail,
  Smartphone,
  Key,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { firebaseService } from '@/services/firebase';

export default function Settings() {
  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [marketUpdates, setMarketUpdates] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState('Admin User');
  const [email, setEmail] = useState('admin@mangochase.com');

  // Farm Code
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmCode, setFarmCode] = useState<string | null>(null);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(true);

  useEffect(() => {
    loadFarmCode();
  }, []);

  const loadFarmCode = async () => {
    try {
      const userProfile = await firebaseService.getUserProfile();
      if (userProfile?.farmId) {
        setFarmId(userProfile.farmId);
        const code = await firebaseService.getFarmCode(userProfile.farmId);
        setFarmCode(code);
      }
    } catch (error) {
      console.error('Error loading farm code:', error);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const copyFarmCode = async () => {
    if (!farmCode) return;
    
    try {
      await navigator.clipboard.writeText(farmCode);
      setCodeCopied(true);
      toast.success('Farm code copied to clipboard!');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    toast.info(enabled ? 'Dark mode enabled (coming soon!)' : 'Light mode enabled');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account settings</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Farm Code Section - NEW */}
        {farmCode && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5 text-primary" />
                Farm Code
              </CardTitle>
              <CardDescription>
                Share this code with team members to join your farm via mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-primary/5 rounded-lg p-4 font-mono text-2xl font-bold tracking-[0.3em] text-primary border border-primary/20">
                  {isCodeVisible ? farmCode : '••••••'}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCodeVisible(!isCodeVisible)}
                  title={isCodeVisible ? 'Hide code' : 'Show code'}
                >
                  {isCodeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyFarmCode}
                  disabled={!isCodeVisible}
                  title="Copy code"
                >
                  {codeCopied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Team members need this code to join your farm from the mobile app.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Appearance */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Mango Chase looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Switch to dark theme
                  </p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="language">Language</Label>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tl">Filipino (Tagalog)</SelectItem>
                  <SelectItem value="ceb">Cebuano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notif">Email Notifications</Label>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-notif">Push Notifications</Label>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>

            <Separator />

            <p className="text-sm font-medium text-muted-foreground">Notification Types</p>

            <div className="flex items-center justify-between">
              <Label htmlFor="disease-alerts" className="font-normal">Disease Alerts</Label>
              <Switch
                id="disease-alerts"
                checked={diseaseAlerts}
                onCheckedChange={setDiseaseAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="task-reminders" className="font-normal">Task Reminders</Label>
              <Switch
                id="task-reminders"
                checked={taskReminders}
                onCheckedChange={setTaskReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="market-updates" className="font-normal">Market Price Updates</Label>
              <Switch
                id="market-updates"
                checked={marketUpdates}
                onCheckedChange={setMarketUpdates}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button className="w-full mt-4" onClick={handleSave}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Data & Storage
            </CardTitle>
            <CardDescription>Manage your data and integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm text-muted-foreground">2.4 GB / 10 GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/4 bg-primary rounded-full" />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Database className="h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}