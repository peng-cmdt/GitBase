'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminPage() {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ name: '', description: '', url: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/check-auth');
      const data = await response.json();
      if (!data.isLoggedIn) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Failed to authenticate. Please try again.');
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchResources();
  }, [checkAuth]);

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 使用本地资源而不是GitHub资源
      const response = await fetch('/api/resources');
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to fetch resources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index !== null) {
      const updatedResources = [...resources];
      updatedResources[index] = { ...updatedResources[index], [name]: value };
      setResources(updatedResources);
    } else {
      setNewResource({ ...newResource, [name]: value });
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('确定要删除这个资源吗？')) {
      const updatedResources = [...resources];
      updatedResources.splice(index, 1);
      
      fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResources),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete resource');
        }
        return response.json();
      })
      .then(() => {
        fetchResources(); // 重新获取最新数据
      })
      .catch(error => {
        console.error('Error deleting resource:', error);
        setError('Failed to delete resource. Please try again.');
      });
    }
  };

  const handleSave = async (index) => {
    let updatedResources = [...resources];
    if (index === -1) {
      updatedResources.push(newResource);
      setNewResource({ name: '', description: '', url: '' });
    }
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedResources),
      });
      if (!response.ok) {
        throw new Error('Failed to save resources');
      }
      await fetchResources(); // Fetch the latest data after saving
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving resources:', error);
      setError('Failed to save resources. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4">
        <Link href="/admin/articles">
          <Button>Manage Articles</Button>
        </Link>
      </div>
      <h2 className="text-xl font-bold mb-4">Resource Management</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource, index) => (
            <TableRow key={index}>
              <TableCell>
                {editingIndex === index ? (
                  <Input name="name" value={resource.name} onChange={(e) => handleInputChange(e, index)} />
                ) : (
                  resource.name
                )}
              </TableCell>
              <TableCell>
                {editingIndex === index ? (
                  <Input name="description" value={resource.description} onChange={(e) => handleInputChange(e, index)} />
                ) : (
                  resource.description
                )}
              </TableCell>
              <TableCell>
                {editingIndex === index ? (
                  <Input name="url" value={resource.url} onChange={(e) => handleInputChange(e, index)} />
                ) : (
                  resource.url
                )}
              </TableCell>
              <TableCell>
                {editingIndex === index ? (
                  <Button onClick={() => handleSave(index)}>Save</Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEdit(index)}>Edit</Button>
                    <Button variant="destructive" onClick={() => handleDelete(index)}>Delete</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Input name="name" value={newResource.name} onChange={handleInputChange} placeholder="New resource name" />
            </TableCell>
            <TableCell>
              <Input name="description" value={newResource.description} onChange={handleInputChange} placeholder="New resource description" />
            </TableCell>
            <TableCell>
              <Input name="url" value={newResource.url} onChange={handleInputChange} placeholder="New resource URL" />
            </TableCell>
            <TableCell>
              <Button onClick={() => handleSave(-1)}>Add New</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}