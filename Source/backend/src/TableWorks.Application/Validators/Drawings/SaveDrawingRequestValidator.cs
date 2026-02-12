using FluentValidation;
using ASideNote.Application.DTOs.Drawings;

namespace ASideNote.Application.Validators.Drawings;

public sealed class SaveDrawingRequestValidator : AbstractValidator<SaveDrawingRequest>
{
    private const int MaxCanvasJsonLength = 5 * 1024 * 1024; // 5 MB

    public SaveDrawingRequestValidator()
    {
        RuleFor(x => x.CanvasJson)
            .NotEmpty().WithMessage("Canvas JSON is required.")
            .MaximumLength(MaxCanvasJsonLength).WithMessage($"Canvas JSON must not exceed {MaxCanvasJsonLength} characters.");
    }
}
