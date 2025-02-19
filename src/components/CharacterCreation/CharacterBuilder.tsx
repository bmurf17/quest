"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CharacterOverview from "./CharacterOverview.tsx";
import { CharacterProvider } from "./CharacterContext.tsx";
import OriginForm from "./forms/OriginForm.tsx";
import RaceForm from "./forms/RaceForm.tsx";
import SubraceForm from "./forms/SubraceForm.tsx";
import ClassForm from "./forms/ClassForm.tsx";
import BackgroundForm from "./forms/BackgroundForm.tsx";
import AbilitiesForm from "./forms/AbilitesForm.tsx";

export default function CharacterBuilder() {
  const [activeTab, setActiveTab] = useState("origin");

  return (
    <CharacterProvider>
      <div className="flex gap-6">
        <div className="w-1/3">
          <CharacterOverview />
        </div>
        <div className="w-2/3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="origin">Origin</TabsTrigger>
              <TabsTrigger value="race">Race</TabsTrigger>
              <TabsTrigger value="subrace">Subrace</TabsTrigger>
              <TabsTrigger value="class">Class</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="abilities">Abilities</TabsTrigger>
            </TabsList>
            <TabsContent value="origin">
              <OriginForm />
            </TabsContent>
            <TabsContent value="race">
              <RaceForm />
            </TabsContent>
            <TabsContent value="subrace">
              <SubraceForm />
            </TabsContent>
            <TabsContent value="class">
              <ClassForm />
            </TabsContent>
            <TabsContent value="background">
              <BackgroundForm />
            </TabsContent>
            <TabsContent value="abilities">
              <AbilitiesForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CharacterProvider>
  );
}
