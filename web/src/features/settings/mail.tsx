import React, { useState } from "react";
import { Input, Button } from "@/shared/components";
import { api } from "@/shared/services";

interface SendIssueRequest {
    to: string;
    subject: string;
    body: string;
}

const MailForm: React.FC = () => {
    const [form, setForm] = useState<SendIssueRequest>({
        to: "",
        subject: "",
        body: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/mail", {
                to: form.to,
                subject: form.subject,
                body: form.body,
            });
            alert("Mail sent!");
            setForm({ to: "", subject: "", body: "" });
        } catch (err) {
            console.error(err);
            alert("Failed to send mail");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-xl max-w-xl">
            <Input
                name="to"
                type="email"
                placeholder="dumitru.moraru@ati.utm.md"
                defaultValue="dumitru.moraru@ati.utm.md"
                value={form.to}
                onChange={handleChange}
                required
            />
            <Input
                name="subject"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
                required
            />
            <textarea
                name="body"
                placeholder="Message body"
                value={form.body}
                onChange={handleChange}
                className="border rounded p-2 h-32 resize-y"
                required
            />
            <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Mail"}
            </Button>
        </form>
    );
};

export default MailForm;
