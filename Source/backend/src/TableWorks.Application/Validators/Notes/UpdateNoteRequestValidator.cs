using FluentValidation;
using TableWorks.Application.DTOs.Notes;

namespace TableWorks.Application.Validators.Notes;

public sealed class UpdateNoteRequestValidator : AbstractValidator<UpdateNoteRequest>
{
    public UpdateNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.Content)
            .NotNull().WithMessage("Content is required.");
    }
}
