"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/app-context";

export default function GroupsPage() {
  const { groups } = useApp();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link to="/groups/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {groups.length > 0 ? (
              groups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.description || "No description"}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.members.length} members
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No groups found. Create a new group to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
