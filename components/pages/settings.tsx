"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="sync">Data & Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm text-muted-foreground">
                    Choose between light, dark, or system theme
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex items-center justify-between">
                  <span>USD ($)</span>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Default split method</Label>
                <div className="flex items-center justify-between">
                  <span>Equal split</span>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Account settings coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Data & Sync</CardTitle>
              <CardDescription>Manage your data and sync settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Offline Mode</Label>
                <div className="flex items-center justify-between">
                  <div>
                    <p>Your data is stored locally</p>
                    <p className="text-sm text-muted-foreground">
                      All your data is stored in your browser and available offline
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Export all your data as a JSON file for backup
                </p>
                <Button variant="outline" size="sm">Export Data</Button>
              </div>
              
              <div className="space-y-2">
                <Label>Import Data</Label>
                <p className="text-sm text-muted-foreground">
                  Import data from a previously exported JSON file
                </p>
                <Button variant="outline" size="sm">Import Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
