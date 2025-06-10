"use client";

import {
  getDealershipInfo,
  getUsers,
  saveWorkingHours,
  updateUserRole,
} from "@/actions/settings";
import { type User as prismaUser } from "@/lib/generated/prisma";
import useFetch from "@/hooks/use-fetch";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Loader,
  Loader2,
  Save,
  Search,
  Shield,
  Users,
  UserX,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Day names for display
const DAYS: { value: string; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];
const SettingsForm = () => {
  const [workingHours, setWorkingHours] = useState<
    | {
        dayOfWeek: string;
        openTime: string;
        closeTime: string;
        isOpen: boolean;
      }[]
    | null
  >(null);
  const [userSearch, setUserSearch] = useState("");
  const [confirmAdminDialog, setConfirmAdminDialog] = useState<boolean>(false);
  const [userToPromote, setUserToPromote] = useState<prismaUser | null>(null);
  const [confirmRemoveDialog, setConfirmRemoveDialog] =
    useState<boolean>(false);
  const [userToDemote, setUserToDemote] = useState<prismaUser | null>(null);

  //custom hooks for api calls
  const {
    loading: fetchingSettings,
    fn: fetchDealershipInfo,
    data: settingsData,
    error: settingsError,
  } = useFetch(getDealershipInfo);

  const {
    loading: savingHours,
    fn: saveHours,
    data: saveResult,
    error: saveError,
  } = useFetch(saveWorkingHours);

  const {
    loading: fetchingUsers,
    fn: fetchUsers,
    data: usersData,
    error: usersError,
  } = useFetch(getUsers);

  const {
    loading: updatingRole,
    fn: updateRole,
    data: updateRoleResult,
    error: updateRoleError,
  } = useFetch(updateUserRole);

  //fetch settings and user on component mount
  useEffect(() => {
    fetchDealershipInfo();
    fetchUsers();
  }, []);

  //set working hours when settings data is fetched
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const dealership = settingsData.data;

      // Only set working hours if we have data from DB
      if (dealership.workingHours.length > 0) {
        const mappedHours = DAYS.map((day) => {
          const hourData = dealership.workingHours.find(
            (h) => h.dayOfWeek === day.value
          );

          return hourData
            ? {
                dayOfWeek: hourData.dayOfWeek,
                openTime: hourData.openTime,
                closeTime: hourData.closeTime,
                isOpen: hourData.isOpen,
              }
            : {
                dayOfWeek: day.value,
                openTime: "09:00",
                closeTime: "18:00",
                isOpen: day.value !== "SUNDAY",
              };
        });
        setWorkingHours(mappedHours);
      } else {
        // Only set defaults if no data exists in DB
        setWorkingHours(
          DAYS.map((day) => ({
            dayOfWeek: day.value,
            openTime: "09:00",
            closeTime: "18:00",
            isOpen: day.value !== "SUNDAY",
          }))
        );
      }
    }
  }, [settingsData]);

  //handle errors
  useEffect(() => {
    if (settingsError) {
      toast.error("Failed to load dealership settings");
    }

    if (saveError) {
      toast.error(`Failed to save working hours: ${saveError.message}`);
    }

    if (usersError) {
      toast.error("Failed to load users");
    }

    if (updateRoleError) {
      toast.error(`Failed to update user role: ${updateRoleError.message}`);
    }
  }, [settingsError, saveError, usersError, updateRoleError]);

  //successful operation
  useEffect(() => {
    if (saveResult?.success) {
      toast.success("Working hours saved successfully");
      fetchDealershipInfo();
    }

    if (updateRoleResult?.success) {
      toast.success("User role updated successfully");
      fetchUsers();
      setConfirmAdminDialog(false);
      setConfirmRemoveDialog(false);
    }
  }, [saveResult, updateRoleResult]);

  //working hours skeleton
  const WorkingHoursSkeleton = () => (
    <div className="space-y-4">
      {DAYS.map((day) => (
        <div
          key={day.value}
          className="grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg bg-gray-100 animate-pulse"
        >
          <div className="col-span-3 md:col-span-2 h-6 bg-gray-200 rounded"></div>
          <div className="col-span-9 md:col-span-10 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  //handle working hour change
  const handleWorkingHourChange = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    if (!workingHours) return;

    const updatedHours = [...workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    };
    setWorkingHours(updatedHours);
  };

  //save working hours
  const handleSaveHours = async () => {
    if (!workingHours) return;

    await saveHours(workingHours);
  };

  //make user admin
  const handleMakeAdmin = async () => {
    if (!userToPromote) return;
    await updateRole(userToPromote.id, "ADMIN");
  };

  //remove addmin privilages
  const handleRemoveAdmin = async () => {
    if (!userToDemote) return;
    await updateRole(userToDemote.id, "USER");
  };

  //filter users by search term
  const filteredUsers = usersData?.success
    ? usersData?.data?.filter((user) => {
        return (
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearch.toLowerCase())
        );
      })
    : [];
  return (
    <div className="space-y-6">
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Working Hours
          </TabsTrigger>

          <TabsTrigger value="admins">
            <Shield className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your dealership&apos;s working hours for each day of the
                week.
              </CardDescription>
            </CardHeader>

            {workingHours === null ? (
              <WorkingHoursSkeleton />
            ) : (
              <CardContent>
                <div className="space-y-4">
                  {DAYS.map((day, index) => (
                    <div
                      key={day.value}
                      className="grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-lg hover:bg-slate-50"
                    >
                      <div className="col-span-3 md:col-span-2">
                        <div className="font-medium">{day.label}</div>
                      </div>

                      <div className="col-span-9 md:col-span-2 flex items-center">
                        <Checkbox
                          id={`is-open-${day.value}`}
                          checked={workingHours[index]?.isOpen}
                          onCheckedChange={(checked) => {
                            handleWorkingHourChange(index, "isOpen", checked);
                          }}
                        />
                        <Label
                          htmlFor={`is-open-${day.value}`}
                          className="ml-2 cursor-pointer"
                        >
                          {workingHours[index]?.isOpen ? "Open" : "Closed"}
                        </Label>
                      </div>

                      {workingHours[index]?.isOpen && (
                        <>
                          <div className="col-span-5 md:col-span-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <Input
                                type="time"
                                value={workingHours[index]?.openTime}
                                onChange={(e) =>
                                  handleWorkingHourChange(
                                    index,
                                    "openTime",
                                    e.target.value
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="text-center col-span-1">to</div>

                          <div className="col-span-5 md:col-span-3">
                            <Input
                              type="time"
                              value={workingHours[index]?.closeTime}
                              onChange={(e) =>
                                handleWorkingHourChange(
                                  index,
                                  "closeTime",
                                  e.target.value
                                )
                              }
                              className="text-sm"
                            />
                          </div>
                        </>
                      )}

                      {!workingHours[index]?.isOpen && (
                        <div className="col-span-11 md:col-span-8 text-gray-500 italic text-sm">
                          Closed All Day
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button disabled={savingHours} onClick={handleSaveHours}>
                    {savingHours ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Working Hours
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage users with admin privileges.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-6 relative">
                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search Users..."
                  className="pl-9 w-full"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {fetchingUsers ? (
                <div>
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : usersData?.success && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {user.imageUrl ? (
                                  <img
                                    src={user.imageUrl}
                                    alt={user.name || "User"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <span>{user.name || "Unknown User"}</span>
                            </div>
                          </TableCell>

                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.role === "ADMIN"
                                  ? "bg-red-100 text-red-800 hover:bg-red-300"
                                  : "bg-gray-800 hover:bg-gray-500"
                              }
                            >
                              {user.role === "ADMIN" ? "Admin" : "User"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            {user.role === "ADMIN" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 cursor-pointer"
                                onClick={() => {
                                  setUserToDemote({
                                    ...user,
                                    createdAt: new Date(
                                      user.createdAt
                                    ),
                                    updatedAt: new Date(
                                      user.updatedAt
                                    ),
                                  });
                                  setConfirmRemoveDialog(true);
                                }}
                                disabled={updatingRole}
                              >
                                <UserX />
                                Remove Admin
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 cursor-pointer"
                                onClick={() => {
                                  setUserToPromote({
                                    ...user,
                                    createdAt: new Date(
                                      user.createdAt
                                    ),
                                    updatedAt: new Date(
                                      user.updatedAt
                                    ),
                                  });
                                  setConfirmAdminDialog(true);
                                }}
                                disabled={updatingRole}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No users found
                  </h3>
                  <p className="text-gray-500">
                    {userSearch
                      ? "No users match your search criteria"
                      : "There are no users registered yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirm Make Admin Dialog */}
          <Dialog
            open={confirmAdminDialog}
            onOpenChange={setConfirmAdminDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Admin Privileges</DialogTitle>
                <DialogDescription>
                  Are you sure you want to give admin privileges to{" "}
                  {userToPromote?.name || userToPromote?.email}? Admin users can
                  manage all aspects of the dealership.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAdminDialog(false)}
                  disabled={updatingRole}
                >
                  Cancel
                </Button>
                <Button onClick={handleMakeAdmin} disabled={updatingRole}>
                  {updatingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm Remove Admin Dialog */}
          <Dialog
            open={confirmRemoveDialog}
            onOpenChange={setConfirmRemoveDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Admin Privileges</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove admin privileges from{" "}
                  {userToDemote?.name || userToDemote?.email}? They will no
                  longer be able to access the admin dashboard.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmRemoveDialog(false)}
                  disabled={updatingRole}
                >
                  Cancel
                </Button>
                <Button onClick={handleRemoveAdmin} disabled={updatingRole}>
                  {updatingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    "Remove Admin"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsForm;
