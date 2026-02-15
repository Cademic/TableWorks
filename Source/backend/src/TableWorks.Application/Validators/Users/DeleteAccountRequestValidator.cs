using FluentValidation;
using ASideNote.Application.DTOs.Users;

namespace ASideNote.Application.Validators.Users;

public sealed class DeleteAccountRequestValidator : AbstractValidator<DeleteAccountRequest>
{
    public DeleteAccountRequestValidator()
    {
        // Password is optional; no rules required when null/empty
    }
}
